import uuid
from typing import NamedTuple, Optional

from sqlmodel import Session, func, select

from app.core.event_types import RECENT_RECIPE_VIEW_EVENT_TYPES
from app.models.interaction_log import InteractionLog
from app.models.recipe import Recipe
from app.models.recipe_ingredient import RecipeIngredient


def get(db: Session, recipe_id: uuid.UUID) -> Optional[Recipe]:
    return db.get(Recipe, recipe_id)


def get_many(db: Session, recipe_ids: set[uuid.UUID]) -> list[Recipe]:
    if not recipe_ids:
        return []
    stmt = select(Recipe).where(Recipe.id.in_(recipe_ids))
    return list(db.exec(stmt).all())


def get_by_title_and_source(db: Session, title: str, source: str) -> Optional[Recipe]:
    stmt = select(Recipe).where(Recipe.title == title).where(Recipe.source == source)
    return db.exec(stmt).first()


def find_candidates_by_ingredient_ids(
    db: Session, ingredient_ids: set[uuid.UUID]
) -> list[Recipe]:
    """이 재료 중 하나라도 쓰는 레시피 후보를 (중복 없이) 반환한다."""
    if not ingredient_ids:
        return []
    stmt = (
        select(Recipe)
        .join(RecipeIngredient, RecipeIngredient.recipe_id == Recipe.id)
        .where(RecipeIngredient.ingredient_id.in_(ingredient_ids))
        .distinct()
    )
    return list(db.exec(stmt).all())


def get_recipe_ingredients(db: Session, recipe_id: uuid.UUID) -> list[RecipeIngredient]:
    stmt = select(RecipeIngredient).where(RecipeIngredient.recipe_id == recipe_id)
    return list(db.exec(stmt).all())


class RecipeIngredientSpecInput(NamedTuple):
    ingredient_id: uuid.UUID
    quantity: str
    is_optional: bool


def get_or_create_llm_recipe(
    db: Session,
    *,
    title: str,
    instructions: str,
    cooking_time_min: int,
    prompt_version: str,
    recipe_ingredient_specs: list[RecipeIngredientSpecInput],
    description: Optional[str] = None,
    servings: Optional[int] = None,
    difficulty: Optional[str] = None,
    tip: Optional[str] = None,
) -> Recipe:
    """같은 title+source='gemini' 레시피가 이미 있으면 재사용하고, 없으면 만든다.

    캐시를 반복 히트해도(같은 해시 → 같은 파싱 결과) recipes/recipe_ingredients에
    중복 행이 쌓이지 않게 하기 위함. description/servings/difficulty/tip은 최초 생성
    시점 값을 그대로 유지한다(재사용 시 덮어쓰지 않음).
    """
    existing = get_by_title_and_source(db, title, "gemini")
    if existing is not None:
        return existing

    recipe = Recipe(
        title=title,
        source="gemini",
        instructions=instructions,
        cooking_time_min=cooking_time_min,
        is_llm_generated=True,
        prompt_version=prompt_version,
        description=description,
        servings=servings,
        difficulty=difficulty,
        tip=tip,
    )
    db.add(recipe)
    db.flush()

    for spec in recipe_ingredient_specs:
        db.add(
            RecipeIngredient(
                recipe_id=recipe.id,
                ingredient_id=spec.ingredient_id,
                quantity=spec.quantity,
                is_optional=spec.is_optional,
            )
        )
    db.flush()
    return recipe


def recent_by_session(db: Session, session_id: uuid.UUID, limit: int = 20) -> list[Recipe]:
    subq = (
        select(
            InteractionLog.recipe_id.label("recipe_id"),
            func.max(InteractionLog.created_at).label("last_viewed_at"),
        )
        .where(InteractionLog.session_id == session_id)
        .where(InteractionLog.event_type.in_(RECENT_RECIPE_VIEW_EVENT_TYPES))
        .where(InteractionLog.recipe_id.is_not(None))
        .group_by(InteractionLog.recipe_id)
        .subquery()
    )
    stmt = (
        select(Recipe)
        .join(subq, Recipe.id == subq.c.recipe_id)
        .order_by(subq.c.last_viewed_at.desc())
        .limit(limit)
    )
    return list(db.exec(stmt).all())
