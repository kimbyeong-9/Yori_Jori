import uuid
from typing import Optional

from sqlmodel import Session, select

from app.models.anonymous_user import AnonymousUser
from app.models.base import utc_now


def get_by_browser_uuid(db: Session, browser_uuid: uuid.UUID) -> Optional[AnonymousUser]:
    stmt = select(AnonymousUser).where(AnonymousUser.browser_uuid == browser_uuid)
    return db.exec(stmt).first()


def create(
    db: Session, browser_uuid: uuid.UUID, user_agent: Optional[str]
) -> AnonymousUser:
    user = AnonymousUser(browser_uuid=browser_uuid, user_agent=user_agent)
    db.add(user)
    db.flush()
    return user


def touch_last_seen(
    db: Session, user: AnonymousUser, user_agent: Optional[str]
) -> AnonymousUser:
    user.last_seen_at = utc_now()
    if user_agent:
        user.user_agent = user_agent
    db.add(user)
    db.flush()
    return user
