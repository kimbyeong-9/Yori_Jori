import uuid
from typing import Any, Optional

from sqlmodel import Session

from app.core.errors import NotFoundError, ValidationError
from app.core.event_types import ALLOWED_EVENT_TYPES
from app.models.interaction_log import InteractionLog
from app.repositories import interaction_log_repo, recipe_repo, user_session_repo


def record_event(
    db: Session,
    session_id: uuid.UUID,
    event_type: str,
    recipe_id: Optional[uuid.UUID],
    metadata: dict[str, Any],
) -> InteractionLog:
    if event_type not in ALLOWED_EVENT_TYPES:
        raise ValidationError(f"허용되지 않은 이벤트 타입입니다: {event_type}")
    if user_session_repo.get(db, session_id) is None:
        raise NotFoundError("세션을 찾을 수 없습니다.")
    if recipe_id is not None and recipe_repo.get(db, recipe_id) is None:
        raise NotFoundError("레시피를 찾을 수 없습니다.")

    log = InteractionLog(
        session_id=session_id,
        recipe_id=recipe_id,
        event_type=event_type,
        event_metadata=metadata,
    )
    interaction_log_repo.create(db, log)
    db.commit()
    return log
