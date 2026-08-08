import json

import httpx
from sqlmodel import select

from app.core.config import settings
from app.integrations.gemini_client import get_http_client
from app.main import app
from app.models.recipe import Recipe
from app.services.recommendation_hash import DEFAULT_LOCALE, compute_ingredients_hash, compute_search_hash
from app.services.recommendation_service import SEARCH_PROMPT_VERSION
from tests.api.helpers import (
    create_session_via_api,
    make_ingredient,
    make_mock_gemini_client,
    make_recipe,
    make_recipe_ingredient,
)


def _override_http_client(mock_client: httpx.AsyncClient) -> None:
    app.dependency_overrides[get_http_client] = lambda: mock_client


def _fail_if_called(request: httpx.Request) -> httpx.Response:
    raise AssertionError("Gemini가 호출되지 않아야 합니다 (DB 경로여야 함)")


def _gemini_success_handler(recipe_items: list[dict]):
    def handler(request: httpx.Request) -> httpx.Response:
        body = {"candidates": [{"content": {"parts": [{"text": json.dumps(recipe_items)}]}}]}
        return httpx.Response(200, json=body)

    return handler


def test_search_db_success_when_enough_matches(client, session):
    _override_http_client(make_mock_gemini_client(_fail_if_called))
    ingredient = make_ingredient(session, name="검색DB성공재료")
    for i in range(3):
        recipe = make_recipe(session, title=f"검색DB성공레시피{i}")
        make_recipe_ingredient(session, recipe, ingredient, is_optional=False)
    sess = create_session_via_api(client)

    resp = client.post(
        "/api/v1/recipes/search",
        json={"session_id": sess["session_id"], "ingredient_names": ["검색DB성공재료"]},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["source"] == "db"
    assert body["cached"] is False
    assert len(body["recipes"]) == 3


def test_search_calls_gemini_and_persists_recipe_when_db_insufficient(client, session):
    ingredient = make_ingredient(session, name="검색캐시미스재료")
    recipe = make_recipe(session, title="검색DB부족레시피")
    make_recipe_ingredient(session, recipe, ingredient, is_optional=False)
    # DB 레시피 1개뿐 → MIN_DB_RECIPE_COUNT(3) 미달 → Gemini 경로.

    gemini_items = [
        {
            "title": "검색으로 새로 생성된 레시피",
            "cooking_time_min": 15,
            "servings": 1,
            "difficulty": "easy",
            "description": "검색 결과 설명",
            "ingredients": ["검색캐시미스재료"],
            "matched_ingredients": ["검색캐시미스재료"],
            "missing_ingredients": [],
            "instructions": "1. 검색 조리법.",
            "tip": "",
            "safety_note": "",
        }
    ]
    _override_http_client(make_mock_gemini_client(_gemini_success_handler(gemini_items)))
    sess = create_session_via_api(client)

    resp = client.post(
        "/api/v1/recipes/search",
        json={"session_id": sess["session_id"], "ingredient_names": ["검색캐시미스재료"]},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["source"] == "gemini"
    assert body["cached"] is False
    assert body["recipes"][0]["title"] == "검색으로 새로 생성된 레시피"
    assert body["recipes"][0]["servings"] == 1

    persisted = session.exec(
        select(Recipe).where(Recipe.title == "검색으로 새로 생성된 레시피")
    ).first()
    assert persisted is not None
    assert persisted.prompt_version == SEARCH_PROMPT_VERSION


def test_search_uses_separate_cache_namespace_from_fridge_flow(session):
    """검색 흐름과 냉장고 흐름은 prompt_version이 달라 같은 재료라도 해시가 다르다."""
    ingredient = make_ingredient(session, name="네임스페이스재료")
    fridge_hash = compute_ingredients_hash(
        [(ingredient.id, "fresh")],
        locale=DEFAULT_LOCALE,
        prompt_version="v2",
        model_name=settings.gemini_model,
    )
    search_hash = compute_search_hash(
        ["네임스페이스재료"],
        prompt_version=SEARCH_PROMPT_VERSION,
        model_name=settings.gemini_model,
    )
    assert fridge_hash != search_hash


def test_search_unmatched_ingredient_name_falls_back_to_gemini(client, session):
    """마스터에 없는 재료명은 DB 매칭에서 제외되고 Gemini 프롬프트에는 그대로 들어간다."""
    gemini_items = [
        {
            "title": "미등록재료 레시피",
            "cooking_time_min": 10,
            "servings": 1,
            "difficulty": "easy",
            "description": "설명",
            "ingredients": ["마스터에없는재료"],
            "matched_ingredients": ["마스터에없는재료"],
            "missing_ingredients": [],
            "instructions": "1. 조리한다.",
            "tip": "",
            "safety_note": "",
        }
    ]
    _override_http_client(make_mock_gemini_client(_gemini_success_handler(gemini_items)))
    sess = create_session_via_api(client)

    resp = client.post(
        "/api/v1/recipes/search",
        json={"session_id": sess["session_id"], "ingredient_names": ["마스터에없는재료"]},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["source"] == "gemini"
    assert body["recipes"][0]["title"] == "미등록재료 레시피"
