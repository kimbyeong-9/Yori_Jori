import uuid


def test_create_session_returns_new_session(client):
    resp = client.post("/api/v1/sessions", json={"browser_uuid": str(uuid.uuid4())})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert "session_id" in body
    assert "anonymous_user_id" in body
    assert "expires_at" in body


def test_repeated_call_with_same_browser_uuid_reuses_session(client):
    browser_uuid = str(uuid.uuid4())
    first = client.post("/api/v1/sessions", json={"browser_uuid": browser_uuid}).json()
    second = client.post("/api/v1/sessions", json={"browser_uuid": browser_uuid}).json()
    assert first["session_id"] == second["session_id"]
    assert first["anonymous_user_id"] == second["anonymous_user_id"]
