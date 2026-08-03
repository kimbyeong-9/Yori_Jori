import uuid

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.api.responses import FORBIDDEN, NOT_FOUND
from app.db.session import get_session
from app.schemas.cook_session import CookSessionCompleteResponse
from app.services import cook_session_service

router = APIRouter(prefix="/cook-sessions", tags=["cook-sessions"])


@router.patch(
    "/{cook_session_id}/complete",
    response_model=CookSessionCompleteResponse,
    responses={**NOT_FOUND, **FORBIDDEN},
    summary="조리 완료",
    description=(
        "조리 세션을 완료 처리한다. recipe_complete 이벤트와 함께 호출한다. "
        "이미 완료된 세션을 다시 호출하면 기존 completed_at을 그대로 반환한다."
    ),
)
def complete_cook_session(
    cook_session_id: uuid.UUID,
    session_id: uuid.UUID = Query(..., description="요청자의 세션 ID(소유권 검증)"),
    db: Session = Depends(get_session),
) -> CookSessionCompleteResponse:
    cook_session = cook_session_service.complete_cooking(
        db, cook_session_id=cook_session_id, session_id=session_id
    )
    return CookSessionCompleteResponse(completed_at=cook_session.completed_at)
