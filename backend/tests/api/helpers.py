import uuid
from typing import Callable, Optional

import httpx

from app.models.fridge_item import FridgeItem
from app.models.ingredient import Ingredient
from app.models.recipe import Recipe
from app.models.recipe_ingredient import RecipeIngredient


def make_ingredient(
    session,
    name: str,
    category: str = "채소",
    unit: str = "개",
    is_top: bool = False,
) -> Ingredient:
    ingredient = Ingredient(
        name=name,
        normalized_name=name.strip().lower(),
        category=category,
        unit=unit,
        is_top=is_top,
    )
    session.add(ingredient)
    session.flush()
    return ingredient


def make_recipe(session, title: str, cooking_time_min: int = 10) -> Recipe:
    recipe = Recipe(
        title=title,
        source="manual",
        instructions="테스트용 조리법",
        cooking_time_min=cooking_time_min,
    )
    session.add(recipe)
    session.flush()
    return recipe


def make_recipe_ingredient(
    session, recipe: Recipe, ingredient: Ingredient, *, is_optional: bool = False
) -> RecipeIngredient:
    recipe_ingredient = RecipeIngredient(
        recipe_id=recipe.id,
        ingredient_id=ingredient.id,
        quantity="1개",
        is_optional=is_optional,
    )
    session.add(recipe_ingredient)
    session.flush()
    return recipe_ingredient


def make_fridge_item(
    session,
    session_id: uuid.UUID,
    ingredient: Ingredient,
    *,
    freshness_status: str = "fresh",
) -> FridgeItem:
    fridge_item = FridgeItem(
        session_id=session_id,
        ingredient_id=ingredient.id,
        input_method="search",
        freshness_status=freshness_status,
    )
    session.add(fridge_item)
    session.flush()
    return fridge_item


def create_session_via_api(client, browser_uuid: Optional[uuid.UUID] = None) -> dict:
    browser_uuid = browser_uuid or uuid.uuid4()
    resp = client.post("/api/v1/sessions", json={"browser_uuid": str(browser_uuid)})
    assert resp.status_code == 200, resp.text
    return resp.json()


def make_mock_gemini_client(
    handler: Callable[[httpx.Request], httpx.Response],
) -> httpx.AsyncClient:
    """Gemini 실제 API를 호출하지 않고 정해진 응답/예외를 돌려주는 AsyncClient."""
    return httpx.AsyncClient(transport=httpx.MockTransport(handler))
