import json

import httpx

from app.integrations.gemini_client import get_http_client
from app.main import app
from tests.api.helpers import make_ingredient, make_mock_gemini_client


def _override_http_client(mock_client: httpx.AsyncClient) -> None:
    app.dependency_overrides[get_http_client] = lambda: mock_client


def _fail_if_called(request: httpx.Request) -> httpx.Response:
    raise AssertionError("Gemini가 호출되지 않아야 합니다 (마스터에 이미 있는 재료여야 함)")


def _gemini_validation_handler(
    is_edible: bool, category: str = "", unit: str = "", reason: str = ""
):
    def handler(request: httpx.Request) -> httpx.Response:
        payload = {
            "is_edible": is_edible,
            "category": category,
            "unit": unit,
            "reason": reason,
        }
        body = {"candidates": [{"content": {"parts": [{"text": json.dumps(payload)}]}}]}
        return httpx.Response(200, json=body)

    return handler


def _gemini_timeout_handler(request: httpx.Request) -> httpx.Response:
    raise httpx.TimeoutException("mock timeout")


def test_create_ingredient_reuses_existing_by_normalized_name(client, session):
    _override_http_client(make_mock_gemini_client(_fail_if_called))
    make_ingredient(session, name="양파", category="채소", unit="개")
    session.commit()

    resp = client.post("/api/v1/ingredients", json={"name": " 양파 "})

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["name"] == "양파"
    assert body["category"] == "채소"


def test_create_ingredient_success(client, session):
    _override_http_client(
        make_mock_gemini_client(
            _gemini_validation_handler(is_edible=True, category="채소", unit="개")
        )
    )

    resp = client.post("/api/v1/ingredients", json={"name": "브로콜리"})

    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["name"] == "브로콜리"
    assert body["category"] == "채소"
    assert body["unit"] == "개"
    assert body["is_top"] is False


def test_create_ingredient_rejects_non_edible(client, session):
    _override_http_client(
        make_mock_gemini_client(
            _gemini_validation_handler(is_edible=False, reason="식재료가 아닙니다")
        )
    )

    resp = client.post("/api/v1/ingredients", json={"name": "세제"})

    assert resp.status_code == 400, resp.text
    assert resp.json()["error"]["code"] == "invalid_request"


def test_create_ingredient_returns_503_when_gemini_unavailable(client, session):
    _override_http_client(make_mock_gemini_client(_gemini_timeout_handler))

    resp = client.post("/api/v1/ingredients", json={"name": "새우"})

    assert resp.status_code == 503, resp.text
    assert resp.json()["error"]["code"] == "external_service_unavailable"


def test_list_ingredients_filters_by_query_category_top(client, session):
    make_ingredient(session, name="양파필터테스트", category="채소", unit="개", is_top=True)
    make_ingredient(session, name="돼지고기필터테스트", category="육류", unit="g", is_top=False)

    resp = client.get("/api/v1/ingredients", params={"query": "양파필터"})
    assert resp.status_code == 200
    names = [i["name"] for i in resp.json()]
    assert "양파필터테스트" in names
    assert "돼지고기필터테스트" not in names

    resp = client.get("/api/v1/ingredients", params={"category": "육류"})
    names = [i["name"] for i in resp.json()]
    assert "돼지고기필터테스트" in names
    assert "양파필터테스트" not in names

    resp = client.get("/api/v1/ingredients", params={"top": "true"})
    names = [i["name"] for i in resp.json()]
    assert "양파필터테스트" in names
    assert "돼지고기필터테스트" not in names
