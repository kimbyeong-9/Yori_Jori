import json
import uuid

import httpx
from sqlmodel import select

from app.core.config import settings
from app.integrations.gemini_client import get_http_client
from app.main import app
from app.models.llm_cache import LLMCache
from app.models.recipe import Recipe
from app.services.recommendation_hash import DEFAULT_LOCALE, compute_ingredients_hash
from app.services.recommendation_service import PROMPT_VERSION
from tests.api.helpers import (
    create_session_via_api,
    make_fridge_item,
    make_ingredient,
    make_mock_gemini_client,
    make_recipe,
    make_recipe_ingredient,
)


def _override_http_client(mock_client: httpx.AsyncClient) -> None:
    app.dependency_overrides[get_http_client] = lambda: mock_client


def _fail_if_called(request: httpx.Request) -> httpx.Response:
    raise AssertionError("Gemini가 호출되지 않아야 합니다 (DB/캐시 경로여야 함)")


def _gemini_success_handler(recipe_items: list[dict]):
    def handler(request: httpx.Request) -> httpx.Response:
        body = {"candidates": [{"content": {"parts": [{"text": json.dumps(recipe_items)}]}}]}
        return httpx.Response(200, json=body)

    return handler


def _gemini_timeout_handler(request: httpx.Request) -> httpx.Response:
    raise httpx.TimeoutException("mock timeout")


def _gemini_invalid_json_handler(request: httpx.Request) -> httpx.Response:
    part = {"text": "이건 JSON이 아님 {{"}
    content = {"parts": [part]}
    candidate = {"content": content}
    body = {"candidates": [candidate]}
    return httpx.Response(200, json=body)


def _compute_hash(fridge_items_and_ingredients: list[tuple]) -> str:
    items = [(ingredient.id, freshness) for _, ingredient, freshness in fridge_items_and_ingredients]
    return compute_ingredients_hash(
        items,
        locale=DEFAULT_LOCALE,
        prompt_version=PROMPT_VERSION,
        model_name=settings.gemini_model,
    )


def test_db_recommendation_success_when_enough_matches(client, session):
    _override_http_client(make_mock_gemini_client(_fail_if_called))
    sess = create_session_via_api(client)
    session_id = uuid.UUID(sess["session_id"])

    ingredient = make_ingredient(session, name="DB성공재료")
    fridge_item = make_fridge_item(session, session_id, ingredient, freshness_status="fresh")
    for i in range(3):
        recipe = make_recipe(session, title=f"DB성공레시피{i}")
        make_recipe_ingredient(session, recipe, ingredient, is_optional=False)

    resp = client.post(
        "/api/v1/recommendations",
        json={"session_id": str(session_id), "fridge_item_ids": [str(fridge_item.id)]},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["source"] == "db"
    assert body["cached"] is False
    assert len(body["recipes"]) == 3


def test_cache_hit_skips_gemini_call(client, session):
    sess = create_session_via_api(client)
    session_id = uuid.UUID(sess["session_id"])

    ingredient = make_ingredient(session, name="캐시히트재료")
    fridge_item = make_fridge_item(session, session_id, ingredient, freshness_status="fresh")
    # DB 매칭은 불충분(레시피 0개)하도록 두어 캐시/Gemini 경로로 가게 한다.

    ingredients_hash = _compute_hash([(fridge_item, ingredient, "fresh")])
    cached_recipes = [
        {
            "title": "캐시된 레시피",
            "cooking_time_min": 10,
            "ingredients": ["캐시히트재료"],
            "matched_ingredients": ["캐시히트재료"],
            "missing_ingredients": [],
            "instructions": "캐시된 조리법",
            "safety_note": "",
        }
    ]
    session.add(
        LLMCache(
            ingredients_hash=ingredients_hash,
            response_text=json.dumps(cached_recipes),
            parsed_recipes=cached_recipes,
            hit_count=0,
            prompt_version=PROMPT_VERSION,
            model_name=settings.gemini_model,
        )
    )
    session.flush()

    _override_http_client(make_mock_gemini_client(_fail_if_called))

    resp = client.post(
        "/api/v1/recommendations",
        json={"session_id": str(session_id), "fridge_item_ids": [str(fridge_item.id)]},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["source"] == "gemini"
    assert body["cached"] is True
    assert body["recipes"][0]["title"] == "캐시된 레시피"

    refreshed = session.exec(
        select(LLMCache).where(LLMCache.ingredients_hash == ingredients_hash)
    ).first()
    assert refreshed.hit_count == 1


def test_cache_miss_calls_gemini_and_persists_recipe(client, session):
    sess = create_session_via_api(client)
    session_id = uuid.UUID(sess["session_id"])

    ingredient = make_ingredient(session, name="캐시미스재료")
    fridge_item = make_fridge_item(session, session_id, ingredient, freshness_status="fresh")

    gemini_items = [
        {
            "title": "새로 생성된 레시피",
            "cooking_time_min": 20,
            "ingredients": ["캐시미스재료"],
            "matched_ingredients": ["캐시미스재료"],
            "missing_ingredients": [],
            "instructions": "새 조리법",
            "safety_note": "",
        }
    ]
    _override_http_client(make_mock_gemini_client(_gemini_success_handler(gemini_items)))

    resp = client.post(
        "/api/v1/recommendations",
        json={"session_id": str(session_id), "fridge_item_ids": [str(fridge_item.id)]},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["source"] == "gemini"
    assert body["cached"] is False
    assert body["recipes"][0]["title"] == "새로 생성된 레시피"

    ingredients_hash = _compute_hash([(fridge_item, ingredient, "fresh")])
    cache_row = session.exec(
        select(LLMCache).where(LLMCache.ingredients_hash == ingredients_hash)
    ).first()
    assert cache_row is not None

    persisted_recipe = session.exec(
        select(Recipe).where(Recipe.title == "새로 생성된 레시피")
    ).first()
    assert persisted_recipe is not None
    assert persisted_recipe.source == "gemini"
    assert persisted_recipe.is_llm_generated is True


def test_gemini_timeout_falls_back_to_db_result(client, session):
    sess = create_session_via_api(client)
    session_id = uuid.UUID(sess["session_id"])

    ingredient = make_ingredient(session, name="타임아웃재료")
    fridge_item = make_fridge_item(session, session_id, ingredient, freshness_status="fresh")
    recipe = make_recipe(session, title="타임아웃폴백레시피")
    make_recipe_ingredient(session, recipe, ingredient, is_optional=False)
    # 레시피 1개뿐이라 MIN_DB_RECIPE_COUNT(3) 미달 → Gemini 경로로 진입하지만 타임아웃.

    _override_http_client(make_mock_gemini_client(_gemini_timeout_handler))

    resp = client.post(
        "/api/v1/recommendations",
        json={"session_id": str(session_id), "fridge_item_ids": [str(fridge_item.id)]},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["source"] == "db"
    assert body["cached"] is False
    assert len(body["recipes"]) == 1
    assert body["recipes"][0]["title"] == "타임아웃폴백레시피"


def test_invalid_gemini_json_falls_back_and_does_not_cache(client, session):
    sess = create_session_via_api(client)
    session_id = uuid.UUID(sess["session_id"])

    ingredient = make_ingredient(session, name="잘못된JSON재료")
    fridge_item = make_fridge_item(session, session_id, ingredient, freshness_status="fresh")
    recipe = make_recipe(session, title="잘못된JSON폴백레시피")
    make_recipe_ingredient(session, recipe, ingredient, is_optional=False)

    _override_http_client(make_mock_gemini_client(_gemini_invalid_json_handler))

    resp = client.post(
        "/api/v1/recommendations",
        json={"session_id": str(session_id), "fridge_item_ids": [str(fridge_item.id)]},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["source"] == "db"
    assert len(body["recipes"]) == 1

    ingredients_hash = _compute_hash([(fridge_item, ingredient, "fresh")])
    cache_row = session.exec(
        select(LLMCache).where(LLMCache.ingredients_hash == ingredients_hash)
    ).first()
    assert cache_row is None


def test_empty_result_when_db_and_gemini_both_empty(client, session):
    sess = create_session_via_api(client)
    session_id = uuid.UUID(sess["session_id"])

    ingredient = make_ingredient(session, name="빈결과재료")
    fridge_item = make_fridge_item(session, session_id, ingredient, freshness_status="fresh")
    # 이 재료를 쓰는 레시피가 DB에 전혀 없음.

    _override_http_client(make_mock_gemini_client(_gemini_success_handler([])))

    resp = client.post(
        "/api/v1/recommendations",
        json={"session_id": str(session_id), "fridge_item_ids": [str(fridge_item.id)]},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["source"] == "gemini"
    assert body["cached"] is False
    assert body["recipes"] == []


def test_other_session_fridge_item_returns_403(client, session):
    _override_http_client(make_mock_gemini_client(_fail_if_called))
    owner = create_session_via_api(client)
    other = create_session_via_api(client)

    ingredient = make_ingredient(session, name="타세션추천재료")
    fridge_item = make_fridge_item(
        session, uuid.UUID(owner["session_id"]), ingredient, freshness_status="fresh"
    )

    resp = client.post(
        "/api/v1/recommendations",
        json={"session_id": other["session_id"], "fridge_item_ids": [str(fridge_item.id)]},
    )
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "forbidden"


def test_nonexistent_fridge_item_returns_404(client):
    _override_http_client(make_mock_gemini_client(_fail_if_called))
    sess = create_session_via_api(client)

    resp = client.post(
        "/api/v1/recommendations",
        json={"session_id": sess["session_id"], "fridge_item_ids": [str(uuid.uuid4())]},
    )
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "not_found"
