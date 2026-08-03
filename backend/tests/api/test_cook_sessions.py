import uuid

from tests.api.helpers import create_session_via_api, make_recipe


def test_start_cook_session_success(client, session):
    sess = create_session_via_api(client)
    recipe = make_recipe(session, title="조리시작레시피")

    resp = client.post(
        f"/api/v1/recipes/{recipe.id}/cook-sessions",
        json={"session_id": sess["session_id"]},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert "cook_session_id" in body
    assert "started_at" in body


def test_start_cook_session_with_nonexistent_recipe_returns_404(client):
    sess = create_session_via_api(client)
    resp = client.post(
        f"/api/v1/recipes/{uuid.uuid4()}/cook-sessions",
        json={"session_id": sess["session_id"]},
    )
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "not_found"


def test_complete_cook_session_success(client, session):
    sess = create_session_via_api(client)
    recipe = make_recipe(session, title="조리완료레시피")
    start_resp = client.post(
        f"/api/v1/recipes/{recipe.id}/cook-sessions",
        json={"session_id": sess["session_id"]},
    )
    cook_session_id = start_resp.json()["cook_session_id"]

    resp = client.patch(
        f"/api/v1/cook-sessions/{cook_session_id}/complete",
        params={"session_id": sess["session_id"]},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["completed_at"] is not None


def test_complete_cook_session_is_idempotent(client, session):
    sess = create_session_via_api(client)
    recipe = make_recipe(session, title="조리완료멱등레시피")
    start_resp = client.post(
        f"/api/v1/recipes/{recipe.id}/cook-sessions",
        json={"session_id": sess["session_id"]},
    )
    cook_session_id = start_resp.json()["cook_session_id"]

    first = client.patch(
        f"/api/v1/cook-sessions/{cook_session_id}/complete",
        params={"session_id": sess["session_id"]},
    )
    second = client.patch(
        f"/api/v1/cook-sessions/{cook_session_id}/complete",
        params={"session_id": sess["session_id"]},
    )
    assert first.json()["completed_at"] == second.json()["completed_at"]


def test_complete_nonexistent_cook_session_returns_404(client):
    sess = create_session_via_api(client)
    resp = client.patch(
        f"/api/v1/cook-sessions/{uuid.uuid4()}/complete",
        params={"session_id": sess["session_id"]},
    )
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "not_found"


def test_complete_cook_session_from_other_session_returns_403(client, session):
    owner = create_session_via_api(client)
    other = create_session_via_api(client)
    recipe = make_recipe(session, title="타세션조리완료레시피")
    start_resp = client.post(
        f"/api/v1/recipes/{recipe.id}/cook-sessions",
        json={"session_id": owner["session_id"]},
    )
    cook_session_id = start_resp.json()["cook_session_id"]

    resp = client.patch(
        f"/api/v1/cook-sessions/{cook_session_id}/complete",
        params={"session_id": other["session_id"]},
    )
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "forbidden"
