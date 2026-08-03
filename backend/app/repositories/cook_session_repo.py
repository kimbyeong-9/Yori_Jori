import uuid
from typing import Optional

from sqlmodel import Session

from app.models.cook_session import CookSession


def get(db: Session, cook_session_id: uuid.UUID) -> Optional[CookSession]:
    return db.get(CookSession, cook_session_id)


def create(db: Session, *, session_id: uuid.UUID, recipe_id: uuid.UUID) -> CookSession:
    cook_session = CookSession(session_id=session_id, recipe_id=recipe_id)
    db.add(cook_session)
    db.flush()
    return cook_session


def save(db: Session, cook_session: CookSession) -> CookSession:
    db.add(cook_session)
    db.flush()
    return cook_session
