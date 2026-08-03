from tests.api.helpers import create_session_via_api


def test_create_event_with_valid_type_returns_202(client):
    sess = create_session_via_api(client)
    resp = client.post(
        "/api/v1/events",
        json={
            "session_id": sess["session_id"],
            "event_type": "ingredient_search",
            "metadata": {"query": "양파"},
        },
    )
    assert resp.status_code == 202


def test_create_event_with_invalid_type_returns_400(client):
    sess = create_session_via_api(client)
    resp = client.post(
        "/api/v1/events",
        json={"session_id": sess["session_id"], "event_type": "not_a_real_event"},
    )
    assert resp.status_code == 400
    assert resp.json()["error"]["code"] == "invalid_request"


def test_create_event_with_nonexistent_session_returns_404(client):
    import uuid

    resp = client.post(
        "/api/v1/events",
        json={"session_id": str(uuid.uuid4()), "event_type": "ingredient_search"},
    )
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "not_found"
