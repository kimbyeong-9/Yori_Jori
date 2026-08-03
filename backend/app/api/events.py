from fastapi import APIRouter, Depends, Response, status
from sqlmodel import Session

from app.api.responses import INVALID_REQUEST, NOT_FOUND
from app.db.session import get_session
from app.schemas.event import EventCreate
from app.services import event_service

router = APIRouter(prefix="/events", tags=["events"])


@router.post(
    "",
    status_code=status.HTTP_202_ACCEPTED,
    responses={**INVALID_REQUEST, **NOT_FOUND},
    summary="이벤트 기록",
    description=(
        "docs/event-taxonomy.md에 정의된 11개 이벤트 타입만 허용한다. "
        "허용되지 않은 event_type은 400을 반환한다."
    ),
)
def create_event(payload: EventCreate, db: Session = Depends(get_session)) -> Response:
    event_service.record_event(
        db,
        session_id=payload.session_id,
        event_type=payload.event_type,
        recipe_id=payload.recipe_id,
        metadata=payload.event_metadata,
    )
    return Response(status_code=status.HTTP_202_ACCEPTED)
