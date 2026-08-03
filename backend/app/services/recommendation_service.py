import json
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import httpx
from pydantic import ValidationError
from sqlmodel import Session

from app.core.config import settings
from app.core.errors import ForbiddenError, NotFoundError
from app.integrations.gemini_client import (
    GeminiInvalidResponseError,
    GeminiRequestError,
    GeminiTimeoutError,
    call_gemini,
)
from app.models.enums import FreshnessStatus
from app.models.fridge_item import FridgeItem
from app.models.ingredient import Ingredient
from app.models.recipe import Recipe
from app.repositories import (
    fridge_item_repo,
    ingredient_repo,
    llm_cache_repo,
    recipe_repo,
    recommendation_repo,
)
from app.repositories.recipe_repo import RecipeIngredientSpecInput
from app.schemas.gemini import GeminiRecipeItem
from app.services.ingredient_normalization import normalize_ingredient_name
from app.services.recommendation_hash import DEFAULT_LOCALE, compute_ingredients_hash
from app.services.recommendation_matching import (
    NEAR_EXPIRY_BONUS,
    MatchResult,
    RecipeIngredientSpec,
    score_recipe,
)

# 튜닝 가능한 상수 (docs/decision-log.md DL-012, 임시값 — 실사용 데이터로 조정 필요).
MIN_DB_MATCH_RATIO = 0.5
MIN_DB_RECIPE_COUNT = 3
MAX_RECIPES_RETURNED = 5

PROMPT_VERSION = "v1"
_PROMPT_PATH = Path(__file__).resolve().parent.parent / "prompts" / "recipe_recommendation_v1.txt"


@dataclass
class RecipeCandidate:
    recipe_id: uuid.UUID
    title: str
    cooking_time_min: int
    instructions: str
    matched_ingredient_names: list[str]
    missing_ingredient_names: list[str]
    safety_note: Optional[str]
    match_score: float


@dataclass
class RecommendationResult:
    recommendation_id: uuid.UUID
    source: str
    cached: bool
    recipes: list[RecipeCandidate]


def _freshness_value(freshness_status: object) -> str:
    """freshness_status는 SQLAlchemy String 컬럼이라 DB에서 막 로드한 FridgeItem은
    FreshnessStatus enum이 아니라 평범한 str을 들고 있다 (컬럼에 sa.Enum을 안 써서
    SQLAlchemy가 자동 변환하지 않음). 둘 다 안전하게 같은 문자열 값으로 정규화한다.
    """
    return FreshnessStatus(freshness_status).value


def _load_prompt_template() -> str:
    return _PROMPT_PATH.read_text(encoding="utf-8")


def _resolve_fridge_items(
    db: Session, session_id: uuid.UUID, fridge_item_ids: list[uuid.UUID]
) -> list[FridgeItem]:
    items = fridge_item_repo.get_many(db, set(fridge_item_ids))
    found_ids = {item.id for item in items}
    if set(fridge_item_ids) - found_ids:
        raise NotFoundError("존재하지 않는 냉장고 재료가 포함되어 있습니다.")
    for item in items:
        if item.session_id != session_id:
            raise ForbiddenError("다른 세션의 냉장고 재료가 포함되어 있습니다.")
    return items


def _build_prompt(fridge_items: list[FridgeItem], ingredient_names: dict[uuid.UUID, str]) -> str:
    lines = [
        f"- {ingredient_names.get(item.ingredient_id, '알수없음')} "
        f"({_freshness_value(item.freshness_status)})"
        for item in fridge_items
    ]
    template = _load_prompt_template()
    return template.format(ingredients_block="\n".join(lines))


def _find_db_candidates(
    db: Session, ingredient_ids: set[uuid.UUID], near_expiry_ids: set[uuid.UUID]
) -> list[tuple[Recipe, MatchResult]]:
    """재료가 겹치는 DB 레시피 후보를 점수 내림차순으로 반환한다."""
    candidates = recipe_repo.find_candidates_by_ingredient_ids(db, ingredient_ids)
    results: list[tuple[Recipe, MatchResult]] = []
    for recipe in candidates:
        recipe_ingredients = recipe_repo.get_recipe_ingredients(db, recipe.id)
        specs = [
            RecipeIngredientSpec(ri.ingredient_id, ri.is_optional) for ri in recipe_ingredients
        ]
        match = score_recipe(recipe.id, specs, ingredient_ids, near_expiry_ids)
        results.append((recipe, match))
    results.sort(key=lambda pair: pair[1].score, reverse=True)
    return results


def _build_db_recipe_candidates(
    db: Session, results: list[tuple[Recipe, MatchResult]]
) -> list[RecipeCandidate]:
    all_ids: set[uuid.UUID] = set()
    for _, match in results:
        all_ids |= match.matched_ingredient_ids
        all_ids |= match.missing_ingredient_ids
    names = {ing.id: ing.name for ing in ingredient_repo.get_many(db, all_ids)}

    return [
        RecipeCandidate(
            recipe_id=recipe.id,
            title=recipe.title,
            cooking_time_min=recipe.cooking_time_min,
            instructions=recipe.instructions,
            matched_ingredient_names=[
                names[i] for i in match.matched_ingredient_ids if i in names
            ],
            missing_ingredient_names=[
                names[i] for i in match.missing_ingredient_ids if i in names
            ],
            safety_note=None,
            match_score=match.score,
        )
        for recipe, match in results
    ]


def _persist_gemini_recipes(
    db: Session,
    items: list[GeminiRecipeItem],
    near_expiry_ids: set[uuid.UUID],
) -> list[RecipeCandidate]:
    candidates: list[RecipeCandidate] = []
    for item in items:
        matched_set = set(item.matched_ingredients)
        specs: list[RecipeIngredientSpecInput] = []
        matched_ingredient_ids: set[uuid.UUID] = set()
        for name in item.ingredients:
            ingredient = ingredient_repo.get_by_normalized_name(
                db, normalize_ingredient_name(name)
            )
            if ingredient is None:
                # 마스터에 없는 재료명은 관계형으로 링크하지 않는다 (DL-007 미결과 별개,
                # 응답의 matched/missing 문자열 목록에는 그대로 남는다).
                continue
            is_optional = name not in matched_set
            specs.append(
                RecipeIngredientSpecInput(
                    ingredient_id=ingredient.id, quantity="", is_optional=is_optional
                )
            )
            if not is_optional:
                matched_ingredient_ids.add(ingredient.id)

        recipe = recipe_repo.get_or_create_llm_recipe(
            db,
            title=item.title,
            instructions=item.instructions,
            cooking_time_min=item.cooking_time_min,
            prompt_version=PROMPT_VERSION,
            recipe_ingredient_specs=specs,
        )

        near_expiry_matched = len(matched_ingredient_ids & near_expiry_ids)
        base_ratio = (
            len(matched_set) / len(item.ingredients) if item.ingredients else 0.0
        )
        score = base_ratio + near_expiry_matched * NEAR_EXPIRY_BONUS

        candidates.append(
            RecipeCandidate(
                recipe_id=recipe.id,
                title=item.title,
                cooking_time_min=item.cooking_time_min,
                instructions=item.instructions,
                matched_ingredient_names=item.matched_ingredients,
                missing_ingredient_names=item.missing_ingredients,
                safety_note=item.safety_note or None,
                match_score=score,
            )
        )
    candidates.sort(key=lambda c: c.match_score, reverse=True)
    return candidates


async def _get_gemini_recipes(
    db: Session,
    http_client: httpx.AsyncClient,
    fridge_items: list[FridgeItem],
    ingredient_names: dict[uuid.UUID, str],
    near_expiry_ids: set[uuid.UUID],
    ingredients_hash: str,
) -> Optional[tuple[list[RecipeCandidate], bool]]:
    """캐시 또는 Gemini 호출로 레시피를 받는다. 실패/무효 응답이면 None(폴백 신호)."""
    cache_row = llm_cache_repo.get_by_hash(db, ingredients_hash)
    if cache_row is not None:
        llm_cache_repo.increment_hit(db, cache_row)
        try:
            items = [GeminiRecipeItem.model_validate(x) for x in cache_row.parsed_recipes]
        except (ValidationError, TypeError):
            return None
        return _persist_gemini_recipes(db, items, near_expiry_ids), True

    prompt = _build_prompt(fridge_items, ingredient_names)
    try:
        raw_text = await call_gemini(
            http_client,
            prompt=prompt,
            model_name=settings.gemini_model,
            api_key=settings.gemini_api_key,
            timeout_seconds=settings.gemini_timeout_seconds,
        )
    except (GeminiTimeoutError, GeminiRequestError, GeminiInvalidResponseError):
        return None

    try:
        raw_data = json.loads(raw_text)
        items = [GeminiRecipeItem.model_validate(x) for x in raw_data]
    except (json.JSONDecodeError, ValidationError, TypeError):
        # 잘못된 JSON/스키마 불일치 — 캐시에 저장하지 않고 폴백 신호를 보낸다.
        return None

    llm_cache_repo.create(
        db,
        ingredients_hash=ingredients_hash,
        response_text=raw_text,
        parsed_recipes=[item.model_dump() for item in items],
        prompt_version=PROMPT_VERSION,
        model_name=settings.gemini_model,
    )
    return _persist_gemini_recipes(db, items, near_expiry_ids), False


async def create_recommendation(
    db: Session,
    http_client: httpx.AsyncClient,
    *,
    session_id: uuid.UUID,
    fridge_item_ids: list[uuid.UUID],
) -> RecommendationResult:
    fridge_items = _resolve_fridge_items(db, session_id, fridge_item_ids)

    ingredient_ids = {item.ingredient_id for item in fridge_items}
    near_expiry_ids = {
        item.ingredient_id
        for item in fridge_items
        if _freshness_value(item.freshness_status) == "near_expiry"
    }
    ingredient_names = {
        ing.id: ing.name for ing in ingredient_repo.get_many(db, ingredient_ids)
    }

    hash_items = [
        (item.ingredient_id, _freshness_value(item.freshness_status)) for item in fridge_items
    ]
    ingredients_hash = compute_ingredients_hash(
        hash_items,
        locale=DEFAULT_LOCALE,
        prompt_version=PROMPT_VERSION,
        model_name=settings.gemini_model,
    )

    db_results = _find_db_candidates(db, ingredient_ids, near_expiry_ids)
    sufficient_count = sum(
        1 for _, match in db_results if match.match_ratio >= MIN_DB_MATCH_RATIO
    )

    if sufficient_count >= MIN_DB_RECIPE_COUNT:
        candidates = _build_db_recipe_candidates(db, db_results[:MAX_RECIPES_RETURNED])
        source, cached = "db", False
    else:
        gemini_result = await _get_gemini_recipes(
            db, http_client, fridge_items, ingredient_names, near_expiry_ids, ingredients_hash
        )
        if gemini_result is None:
            candidates = _build_db_recipe_candidates(db, db_results[:MAX_RECIPES_RETURNED])
            source, cached = "db", False
        else:
            raw_candidates, cached = gemini_result
            candidates = raw_candidates[:MAX_RECIPES_RETURNED]
            source = "gemini"

    request = recommendation_repo.create_request(
        db, session_id=session_id, ingredients_hash=ingredients_hash, source=source
    )
    recommendation_repo.create_request_items(
        db,
        recommendation_request_id=request.id,
        fridge_item_freshness=[(item.id, item.freshness_status) for item in fridge_items],
    )
    db.commit()

    return RecommendationResult(
        recommendation_id=request.id, source=source, cached=cached, recipes=candidates
    )
