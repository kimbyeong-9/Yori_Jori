from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db.session import get_session
from app.schemas.session import SessionCreate, SessionRead
from app.services import session_service

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post(
    "",
    response_model=SessionRead,
    summary="세션 생성/재사용",
    description=(
        "브라우저에 저장된 browser_uuid로 익명 사용자를 찾거나 새로 만든다. "
        "그 사용자의 만료되지 않은 세션이 있으면 재사용하고, 없으면 30일 유효기간의 "
        "새 세션을 발급한다."
    ),
)
def create_session(
    payload: SessionCreate, db: Session = Depends(get_session)
) -> SessionRead:
    user, session_row = session_service.get_or_create_session(
        db, payload.browser_uuid, payload.user_agent
    )
    return SessionRead(
        session_id=session_row.id,
        anonymous_user_id=user.id,
        created_at=session_row.created_at,
        expires_at=session_row.expires_at,
    )
