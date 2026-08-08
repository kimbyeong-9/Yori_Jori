import uuid
from datetime import datetime, timedelta, timezone

from app.repositories import fridge_item_repo
from tests.api.helpers import create_session_via_api, make_fridge_item, make_ingredient


def test_create_fridge_item_fresh_sets_action_due_at_48h(client, session):
    sess = create_session_via_api(client)
    ingredient = make_ingredient(session, name="냉장고재료프레시")

    resp = client.post(
        "/api/v1/fridge-items",
        json={
            "session_id": sess["session_id"],
            "ingredient_id": str(ingredient.id),
            "input_method": "search",
            "freshness_status": "fresh",
        },
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    created = datetime.fromisoformat(body["created_at"])
    due = datetime.fromisoformat(body["action_due_at"])
    assert due - created == timedelta(hours=48)
    assert body["ingredient"]["id"] == str(ingredient.id)


def test_create_fridge_item_near_expiry_sets_action_due_at_24h(client, session):
    sess = create_session_via_api(client)
    ingredient = make_ingredient(session, name="냉장고재료임박")

    resp = client.post(
        "/api/v1/fridge-items",
        json={
            "session_id": sess["session_id"],
            "ingredient_id": str(ingredient.id),
            "input_method": "search",
            "freshness_status": "near_expiry",
            "food_expires_at": "2026-08-05T00:00:00+00:00",
        },
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    created = datetime.fromisoformat(body["created_at"])
    due = datetime.fromisoformat(body["action_due_at"])
    assert due - created == timedelta(hours=24)
    assert body["food_expires_at"] is not None


def test_create_fridge_item_expired_has_no_action_due_at(client, session):
    sess = create_session_via_api(client)
    ingredient = make_ingredient(session, name="냉장고재료만료")

    resp = client.post(
        "/api/v1/fridge-items",
        json={
            "session_id": sess["session_id"],
            "ingredient_id": str(ingredient.id),
            "input_method": "search",
            "freshness_status": "expired",
        },
    )
    assert resp.status_code == 201, resp.text
    assert resp.json()["action_due_at"] is None


def test_patch_freshness_status_recomputes_from_now(client, session):
    sess = create_session_via_api(client)
    ingredient = make_ingredient(session, name="냉장고재료수정")
    created = client.post(
        "/api/v1/fridge-items",
        json={
            "session_id": sess["session_id"],
            "ingredient_id": str(ingredient.id),
            "input_method": "search",
            "freshness_status": "fresh",
        },
    ).json()

    before_patch = datetime.now(timezone.utc)
    resp = client.patch(
        f"/api/v1/fridge-items/{created['id']}",
        params={"session_id": sess["session_id"]},
        json={"freshness_status": "near_expiry"},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    due = datetime.fromisoformat(body["action_due_at"])
    # created_at 기준(+24h)이 아니라 "지금" 기준(+24h)이어야 한다.
    assert abs((due - (before_patch + timedelta(hours=24))).total_seconds()) < 5


def test_patch_quantity_only_keeps_action_due_at(client, session):
    sess = create_session_via_api(client)
    ingredient = make_ingredient(session, name="냉장고재료수량수정")
    created = client.post(
        "/api/v1/fridge-items",
        json={
            "session_id": sess["session_id"],
            "ingredient_id": str(ingredient.id),
            "input_method": "search",
            "freshness_status": "fresh",
        },
    ).json()

    resp = client.patch(
        f"/api/v1/fridge-items/{created['id']}",
        params={"session_id": sess["session_id"]},
        json={"quantity": "2개"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["quantity"] == "2개"
    assert body["action_due_at"] == created["action_due_at"]


def test_delete_fridge_item(client, session):
    sess = create_session_via_api(client)
    ingredient = make_ingredient(session, name="냉장고재료삭제")
    created = client.post(
        "/api/v1/fridge-items",
        json={
            "session_id": sess["session_id"],
            "ingredient_id": str(ingredient.id),
            "input_method": "search",
            "freshness_status": "fresh",
        },
    ).json()

    resp = client.delete(
        f"/api/v1/fridge-items/{created['id']}", params={"session_id": sess["session_id"]}
    )
    assert resp.status_code == 204

    resp = client.get("/api/v1/fridge-items", params={"session_id": sess["session_id"]})
    assert resp.json() == []


def test_patch_nonexistent_fridge_item_returns_404(client):
    sess = create_session_via_api(client)
    resp = client.patch(
        f"/api/v1/fridge-items/{uuid.uuid4()}",
        params={"session_id": sess["session_id"]},
        json={"quantity": "1개"},
    )
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "not_found"


def test_other_session_cannot_patch_fridge_item(client, session):
    owner = create_session_via_api(client)
    other = create_session_via_api(client)
    ingredient = make_ingredient(session, name="냉장고재료타세션")
    created = client.post(
        "/api/v1/fridge-items",
        json={
            "session_id": owner["session_id"],
            "ingredient_id": str(ingredient.id),
            "input_method": "search",
            "freshness_status": "fresh",
        },
    ).json()

    resp = client.patch(
        f"/api/v1/fridge-items/{created['id']}",
        params={"session_id": other["session_id"]},
        json={"quantity": "2개"},
    )
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "forbidden"


def test_list_fridge_items_deletes_expired_action_due_at(client, session):
    sess = create_session_via_api(client)
    ingredient = make_ingredient(session, name="냉장고재료만료정리")
    item = make_fridge_item(session, uuid.UUID(sess["session_id"]), ingredient)
    item.action_due_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    session.add(item)
    session.flush()

    resp = client.get("/api/v1/fridge-items", params={"session_id": sess["session_id"]})
    assert resp.status_code == 200
    assert resp.json() == []


def test_list_fridge_items_keeps_not_yet_expired_item(client, session):
    sess = create_session_via_api(client)
    ingredient = make_ingredient(session, name="냉장고재료임박안됨")
    item = make_fridge_item(session, uuid.UUID(sess["session_id"]), ingredient)
    item.action_due_at = datetime.now(timezone.utc) + timedelta(hours=1)
    session.add(item)
    session.flush()

    resp = client.get("/api/v1/fridge-items", params={"session_id": sess["session_id"]})
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_list_fridge_items_keeps_expired_status_without_action_due_at(client, session):
    sess = create_session_via_api(client)
    ingredient = make_ingredient(session, name="냉장고재료상태만료")
    make_fridge_item(
        session, uuid.UUID(sess["session_id"]), ingredient, freshness_status="expired"
    )

    resp = client.get("/api/v1/fridge-items", params={"session_id": sess["session_id"]})
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_list_fridge_items_does_not_affect_other_session(client, session):
    owner = create_session_via_api(client)
    other = create_session_via_api(client)
    ingredient = make_ingredient(session, name="냉장고재료타세션만료")
    item = make_fridge_item(session, uuid.UUID(owner["session_id"]), ingredient)
    item.action_due_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    session.add(item)
    session.flush()

    resp = client.get("/api/v1/fridge-items", params={"session_id": other["session_id"]})
    assert resp.status_code == 200
    assert resp.json() == []

    # other 세션 조회가 owner의 만료 항목까지 지우면 안 된다(세션별로 스코프됨).
    assert fridge_item_repo.get(session, item.id) is not None


def test_other_session_cannot_delete_fridge_item(client, session):
    owner = create_session_via_api(client)
    other = create_session_via_api(client)
    ingredient = make_ingredient(session, name="냉장고재료타세션삭제")
    created = client.post(
        "/api/v1/fridge-items",
        json={
            "session_id": owner["session_id"],
            "ingredient_id": str(ingredient.id),
            "input_method": "search",
            "freshness_status": "fresh",
        },
    ).json()

    resp = client.delete(
        f"/api/v1/fridge-items/{created['id']}", params={"session_id": other["session_id"]}
    )
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "forbidden"
