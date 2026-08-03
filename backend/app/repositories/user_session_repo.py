import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import Session, select

from app.models.user_session import UserSession


def get(db: Session, session_id: uuid.UUID) -> Optional[UserSession]:
    return db.get(UserSession, session_id)


def get_valid_by_anonymous_user(
    db: Session, anonymous_user_id: uuid.UUID, now: datetime
) -> Optional[UserSession]:
    stmt = (
        select(UserSession)
        .where(UserSession.anonymous_user_id == anonymous_user_id)
        .where(UserSession.expires_at > now)
        .order_by(UserSession.created_at.desc())
    )
    return db.exec(stmt).first()


def create(
    db: Session, anonymous_user_id: uuid.UUID, expires_at: datetime
) -> UserSession:
    session_row = UserSession(anonymous_user_id=anonymous_user_id, expires_at=expires_at)
    db.add(session_row)
    db.flush()
    return session_row
