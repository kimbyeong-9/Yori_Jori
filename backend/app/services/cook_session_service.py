import uuid
from datetime import datetime, timezone

from sqlmodel import Session

from app.core.errors import ForbiddenError, NotFoundError
from app.models.cook_session import CookSession
from app.repositories import cook_session_repo, recipe_repo, user_session_repo


def start_cooking(db: Session, *, session_id: uuid.UUID, recipe_id: uuid.UUID) -> CookSession:
    if user_session_repo.get(db, session_id) is None:
        raise NotFoundError("세션을 찾을 수 없습니다.")
    if recipe_repo.get(db, recipe_id) is None:
        raise NotFoundError("레시피를 찾을 수 없습니다.")

    cook_session = cook_session_repo.create(db, session_id=session_id, recipe_id=recipe_id)
    db.commit()
    return cook_session


def complete_cooking(
    db: Session, *, cook_session_id: uuid.UUID, session_id: uuid.UUID
) -> CookSession:
    cook_session = cook_session_repo.get(db, cook_session_id)
    if cook_session is None:
        raise NotFoundError("조리 세션을 찾을 수 없습니다.")
    if cook_session.session_id != session_id:
        raise ForbiddenError("다른 세션의 조리 세션에 접근할 수 없습니다.")

    # 이미 완료된 세션을 다시 완료 요청해도 completed_at을 덮어쓰지 않는다(idempotent).
    if cook_session.completed_at is None:
        cook_session.completed_at = datetime.now(timezone.utc)
        cook_session_repo.save(db, cook_session)
        db.commit()
    return cook_session
