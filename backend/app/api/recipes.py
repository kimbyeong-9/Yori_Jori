import uuid

import httpx
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.api.responses import NOT_FOUND
from app.db.session import get_session
from app.integrations.gemini_client import get_http_client
from app.schemas.ingredient import IngredientRead
from app.schemas.recipe import RecipeIngredientRead, RecipeRead, RecipeSummary
from app.schemas.recommendation import (
    RecipeSearchCreate,
    RecommendationResponse,
    RecommendedRecipe,
)
from app.services import recipe_service, recommendation_service

router = APIRouter(prefix="/recipes", tags=["recipes"])


# NOTE: /recent, /search를 /{recipe_id}보다 먼저 등록해야 한다. 순서가 바뀌면 이 고정
# 경로들이 {recipe_id}(UUID)로 파싱되려다 422를 내며 이 라우트에 절대 도달하지 못한다.
@router.get(
    "/recent",
    response_model=list[RecipeSummary],
    summary="최근 본 레시피",
    description=(
        "해당 세션의 recipe_detail_view 또는 recipe_click 로그를 기준으로, "
        "레시피별 가장 최근 조회 시각 순으로(중복 제거) 반환한다."
    ),
)
def list_recent_recipes(
    session_id: uuid.UUID = Query(..., description="조회할 세션 ID"),
    db: Session = Depends(get_session),
) -> list[RecipeSummary]:
    recipes = recipe_service.list_recent_recipes(db, session_id)
    return [RecipeSummary.model_validate(recipe) for recipe in recipes]


@router.post(
    "/search",
    response_model=RecommendationResponse,
    summary="자유 재료명으로 레시피 검색 (BL-13, 홈페이지)",
    description=(
        "냉장고 등록 없이 재료명 문자열만으로 레시피를 찾는다. 신선도/임박 가중치는 없다"
        "(항상 0). DB 매칭 → 부족하면 llm_cache/Gemini 폴백이라는 흐름과 응답 모양은 "
        "POST /recommendations와 동일하다."
    ),
)
async def search_recipes(
    payload: RecipeSearchCreate,
    db: Session = Depends(get_session),
    http_client: httpx.AsyncClient = Depends(get_http_client),
) -> RecommendationResponse:
    result = await recommendation_service.search_recipes_by_names(
        db,
        http_client,
        session_id=payload.session_id,
        ingredient_names=payload.ingredient_names,
    )
    return RecommendationResponse(
        recommendation_id=result.recommendation_id,
        source=result.source,
        cached=result.cached,
        recipes=[
            RecommendedRecipe(
                id=r.recipe_id,
                title=r.title,
                cooking_time_min=r.cooking_time_min,
                instructions=r.instructions,
                matched_ingredients=r.matched_ingredient_names,
                missing_ingredients=r.missing_ingredient_names,
                safety_note=r.safety_note,
                match_score=r.match_score,
                description=r.description,
                servings=r.servings,
                difficulty=r.difficulty,
                tip=r.tip,
            )
            for r in result.recipes
        ],
    )


@router.get(
    "/{recipe_id}",
    response_model=RecipeRead,
    responses={**NOT_FOUND},
    summary="레시피 상세",
    description="레시피 단건과 필요한 재료 목록(마스터 재료 정보 포함)을 조회한다.",
)
def get_recipe(recipe_id: uuid.UUID, db: Session = Depends(get_session)) -> RecipeRead:
    recipe = recipe_service.get_recipe(db, recipe_id)
    ingredient_pairs = recipe_service.get_recipe_ingredients(db, recipe_id)
    return RecipeRead(
        id=recipe.id,
        title=recipe.title,
        source=recipe.source,
        source_url=recipe.source_url,
        instructions=recipe.instructions,
        cooking_time_min=recipe.cooking_time_min,
        is_llm_generated=recipe.is_llm_generated,
        created_at=recipe.created_at,
        description=recipe.description,
        servings=recipe.servings,
        difficulty=recipe.difficulty,
        tip=recipe.tip,
        ingredients=[
            RecipeIngredientRead(
                ingredient=IngredientRead.model_validate(ingredient),
                quantity=recipe_ingredient.quantity,
                is_optional=recipe_ingredient.is_optional,
            )
            for recipe_ingredient, ingredient in ingredient_pairs
        ],
    )
