import uuid
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy.exc import IntegrityError

from app.models.anonymous_user import AnonymousUser
from app.models.recipe import Recipe
from app.models.saved_recipe import SavedRecipe
from app.models.user_session import UserSession


def _make_session_and_recipe(session):
    anon = AnonymousUser(browser_uuid=uuid.uuid4())
    session.add(anon)
    session.flush()

    user_session = UserSession(
        anonymous_user_id=anon.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=30),
    )
    session.add(user_session)

    recipe = Recipe(
        title="테스트 레시피",
        source="manual",
        instructions="테스트용 조리법",
        cooking_time_min=10,
    )
    session.add(recipe)
    session.flush()
    return user_session, recipe


def test_duplicate_saved_recipe_rejected(session):
    user_session, recipe = _make_session_and_recipe(session)

    session.add(SavedRecipe(session_id=user_session.id, recipe_id=recipe.id))
    session.commit()

    session.add(SavedRecipe(session_id=user_session.id, recipe_id=recipe.id))
    with pytest.raises(IntegrityError):
        session.commit()
