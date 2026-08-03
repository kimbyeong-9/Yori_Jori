import uuid
from datetime import datetime, timedelta, timezone

from app.models.interaction_log import InteractionLog
from tests.api.helpers import (
    create_session_via_api,
    make_ingredient,
    make_recipe,
    make_recipe_ingredient,
)


def test_get_recipe_not_found_returns_404(client):
    resp = client.get(f"/api/v1/recipes/{uuid.uuid4()}")
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "not_found"


def test_get_recipe_returns_detail_with_ingredients(client, session):
    recipe = make_recipe(session, title="상세조회레시피")
    ingredient = make_ingredient(session, name="상세조회재료")
    make_recipe_ingredient(session, recipe, ingredient, is_optional=False)

    resp = client.get(f"/api/v1/recipes/{recipe.id}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["title"] == "상세조회레시피"
    assert len(body["ingredients"]) == 1
    assert body["ingredients"][0]["ingredient"]["name"] == "상세조회재료"
    assert body["ingredients"][0]["is_optional"] is False


def test_recent_recipes_ordered_by_last_view_desc_and_deduped(client, session):
    sess = create_session_via_api(client)
    session_id = uuid.UUID(sess["session_id"])

    recipe_a = make_recipe(session, title="최근조회레시피A")
    recipe_b = make_recipe(session, title="최근조회레시피B")

    now = datetime.now(timezone.utc)
    # A를 오래 전에 봄, B를 그보다 최근에 봄, A를 다시 지금 봄(A가 가장 최신이어야 함)
    session.add(
        InteractionLog(
            session_id=session_id,
            recipe_id=recipe_a.id,
            event_type="recipe_detail_view",
            created_at=now - timedelta(minutes=10),
        )
    )
    session.add(
        InteractionLog(
            session_id=session_id,
            recipe_id=recipe_b.id,
            event_type="recipe_click",
            created_at=now - timedelta(minutes=1),
        )
    )
    session.add(
        InteractionLog(
            session_id=session_id,
            recipe_id=recipe_a.id,
            event_type="recipe_detail_view",
            created_at=now,
        )
    )
    session.flush()

    resp = client.get("/api/v1/recipes/recent", params={"session_id": str(session_id)})
    assert resp.status_code == 200
    titles = [r["title"] for r in resp.json()]
    assert titles == ["최근조회레시피A", "최근조회레시피B"]
