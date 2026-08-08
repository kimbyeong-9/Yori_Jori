from sqlmodel import Session, select

from app.models.ingredient import Ingredient
from app.models.recipe import Recipe
from app.models.recipe_ingredient import RecipeIngredient
from app.services.ingredient_normalization import normalize_ingredient_name

TEST_RECIPE_TITLE = "계란볶음밥"


def seed_test_recipe(session: Session) -> Recipe:
    """개발/테스트용 레시피 1건을 idempotent하게 시드한다."""
    existing = session.exec(select(Recipe).where(Recipe.title == TEST_RECIPE_TITLE)).first()
    if existing:
        return existing

    def _ingredient(normalized_name: str) -> Ingredient:
        ingredient = session.exec(
            select(Ingredient).where(Ingredient.normalized_name == normalized_name)
        ).first()
        if ingredient is None:
            raise RuntimeError(
                f"'{normalized_name}' 재료가 없습니다. seed_top_ingredients를 먼저 실행하세요."
            )
        return ingredient

    egg = _ingredient(normalize_ingredient_name("계란"))
    onion = _ingredient(normalize_ingredient_name("양파"))
    carrot = _ingredient(normalize_ingredient_name("당근"))

    recipe = Recipe(
        title=TEST_RECIPE_TITLE,
        source="manual",
        instructions=(
            "1. 밥과 채소를 잘게 썬다.\n"
            "2. 팬에 기름을 두르고 채소를 볶는다.\n"
            "3. 계란을 풀어 넣고 밥과 함께 볶는다.\n"
            "4. 소금과 후추로 간을 맞춘다."
        ),
        cooking_time_min=15,
        is_llm_generated=False,
        description="누구나 실패 없이 만드는 기본 계란볶음밥",
        servings=2,
        difficulty="easy",
        tip="찬밥을 쓰면 밥알이 서로 붙지 않고 고소하게 볶아집니다.",
    )
    session.add(recipe)
    session.flush()

    for ingredient, quantity, is_optional in (
        (egg, "2개", False),
        (onion, "1/2개", False),
        (carrot, "1/4개", True),
    ):
        session.add(
            RecipeIngredient(
                recipe_id=recipe.id,
                ingredient_id=ingredient.id,
                quantity=quantity,
                is_optional=is_optional,
            )
        )
    session.commit()
    return recipe
