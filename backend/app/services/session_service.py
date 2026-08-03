import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.exc import IntegrityError
from sqlmodel import Session

from app.models.anonymous_user import AnonymousUser
from app.models.user_session import UserSession
from app.repositories import anonymous_user_repo, user_session_repo

# 세션 기본 유효기간 (docs/decision-log.md DL-003, 2026-07-31 확정: 30일).
SESSION_VALIDITY = timedelta(days=30)


def get_or_create_session(
    db: Session, browser_uuid: uuid.UUID, user_agent: Optional[str]
) -> tuple[AnonymousUser, UserSession]:
    """browser_uuid로 익명 사용자를 재사용하고, 유효기간이 남은 세션이 있으면
    그 세션을 재사용한다(없으면 새로 만든다). 새로고침/재방문 시에도 같은
    session_id를 유지해야 fridge_items/saved_recipes 접근이 끊기지 않는다.
    """
    user = anonymous_user_repo.get_by_browser_uuid(db, browser_uuid)
    if user is None:
        try:
            user = anonymous_user_repo.create(db, browser_uuid, user_agent)
        except IntegrityError:
            # 같은 browser_uuid로 거의 동시에 두 요청이 들어오면(예: React StrictMode의
            # effect 이중 호출, 여러 탭 동시 로드) 둘 다 "없음"을 보고 INSERT를 시도해
            # unique 제약 위반이 날 수 있다. 롤백 후 이미 커밋된 행을 다시 조회해 이어간다.
            db.rollback()
            user = anonymous_user_repo.get_by_browser_uuid(db, browser_uuid)
            if user is None:
                raise
            user = anonymous_user_repo.touch_last_seen(db, user, user_agent)
    else:
        user = anonymous_user_repo.touch_last_seen(db, user, user_agent)

    now = datetime.now(timezone.utc)
    session_row = user_session_repo.get_valid_by_anonymous_user(db, user.id, now)
    if session_row is None:
        session_row = user_session_repo.create(db, user.id, now + SESSION_VALIDITY)

    db.commit()
    return user, session_row
