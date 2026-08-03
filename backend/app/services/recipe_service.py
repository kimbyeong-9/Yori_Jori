import uuid

from sqlmodel import Session

from app.core.errors import NotFoundError
from app.models.ingredient import Ingredient
from app.models.recipe import Recipe
from app.models.recipe_ingredient import RecipeIngredient
from app.repositories import ingredient_repo, recipe_repo


def get_recipe(db: Session, recipe_id: uuid.UUID) -> Recipe:
    recipe = recipe_repo.get(db, recipe_id)
    if recipe is None:
        raise NotFoundError("레시피를 찾을 수 없습니다.")
    return recipe


def get_recipe_ingredients(
    db: Session, recipe_id: uuid.UUID
) -> list[tuple[RecipeIngredient, Ingredient]]:
    recipe_ingredients = recipe_repo.get_recipe_ingredients(db, recipe_id)
    ingredients = {
        ing.id: ing
        for ing in ingredient_repo.get_many(db, {ri.ingredient_id for ri in recipe_ingredients})
    }
    return [
        (ri, ingredients[ri.ingredient_id])
        for ri in recipe_ingredients
        if ri.ingredient_id in ingredients
    ]


def list_recent_recipes(db: Session, session_id: uuid.UUID, limit: int = 20) -> list[Recipe]:
    return recipe_repo.recent_by_session(db, session_id, limit=limit)
