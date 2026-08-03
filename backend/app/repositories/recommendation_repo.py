import uuid

from sqlmodel import Session

from app.models.enums import FreshnessStatus
from app.models.recommendation_request import RecommendationRequest
from app.models.recommendation_request_item import RecommendationRequestItem


def create_request(
    db: Session, *, session_id: uuid.UUID, ingredients_hash: str, source: str
) -> RecommendationRequest:
    request = RecommendationRequest(
        session_id=session_id, ingredients_hash=ingredients_hash, source=source
    )
    db.add(request)
    db.flush()
    return request


def create_request_items(
    db: Session,
    *,
    recommendation_request_id: uuid.UUID,
    fridge_item_freshness: list[tuple[uuid.UUID, FreshnessStatus]],
) -> list[RecommendationRequestItem]:
    items = [
        RecommendationRequestItem(
            recommendation_request_id=recommendation_request_id,
            fridge_item_id=fridge_item_id,
            freshness_status=freshness_status,
        )
        for fridge_item_id, freshness_status in fridge_item_freshness
    ]
    for item in items:
        db.add(item)
    db.flush()
    return items
