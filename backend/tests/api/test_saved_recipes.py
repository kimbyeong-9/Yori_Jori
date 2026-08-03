from tests.api.helpers import create_session_via_api, make_recipe


def test_save_list_and_unsave_recipe(client, session):
    sess = create_session_via_api(client)
    recipe = make_recipe(session, title="저장플로우레시피")

    resp = client.post(
        "/api/v1/saved-recipes",
        json={"session_id": sess["session_id"], "recipe_id": str(recipe.id)},
    )
    assert resp.status_code == 201, resp.text

    resp = client.get("/api/v1/saved-recipes", params={"session_id": sess["session_id"]})
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 1
    assert items[0]["recipe"]["title"] == "저장플로우레시피"

    resp = client.delete(
        f"/api/v1/saved-recipes/{recipe.id}", params={"session_id": sess["session_id"]}
    )
    assert resp.status_code == 204

    resp = client.get("/api/v1/saved-recipes", params={"session_id": sess["session_id"]})
    assert resp.json() == []


def test_duplicate_save_returns_409(client, session):
    sess = create_session_via_api(client)
    recipe = make_recipe(session, title="중복저장레시피")

    first = client.post(
        "/api/v1/saved-recipes",
        json={"session_id": sess["session_id"], "recipe_id": str(recipe.id)},
    )
    assert first.status_code == 201

    second = client.post(
        "/api/v1/saved-recipes",
        json={"session_id": sess["session_id"], "recipe_id": str(recipe.id)},
    )
    assert second.status_code == 409
    assert second.json()["error"]["code"] == "conflict"


def test_other_session_cannot_unsave_returns_403(client, session):
    owner = create_session_via_api(client)
    other = create_session_via_api(client)
    recipe = make_recipe(session, title="타세션저장취소레시피")

    resp = client.post(
        "/api/v1/saved-recipes",
        json={"session_id": owner["session_id"], "recipe_id": str(recipe.id)},
    )
    assert resp.status_code == 201

    resp = client.delete(
        f"/api/v1/saved-recipes/{recipe.id}", params={"session_id": other["session_id"]}
    )
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "forbidden"


def test_unsave_never_saved_recipe_returns_404(client, session):
    sess = create_session_via_api(client)
    recipe = make_recipe(session, title="저장안된레시피")

    resp = client.delete(
        f"/api/v1/saved-recipes/{recipe.id}", params={"session_id": sess["session_id"]}
    )
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "not_found"
