import uuid

from sqlalchemy import CheckConstraint, Column, String
from sqlmodel import Field, SQLModel

from app.models.base import uuid_pk_field
from app.models.enums import FreshnessStatus


class RecommendationRequestItem(SQLModel, table=True):
    __tablename__ = "recommendation_request_items"

    id: uuid.UUID = uuid_pk_field()
    recommendation_request_id: uuid.UUID = Field(
        foreign_key="recommendation_requests.id", index=True
    )
    fridge_item_id: uuid.UUID = Field(foreign_key="fridge_items.id", index=True)
    # 추천 요청 시점의 신선도 상태 스냅샷 (이후 fridge_items.freshness_status가
    # 바뀌어도 요청 당시 값은 보존한다).
    freshness_status: FreshnessStatus = Field(sa_column=Column(String, nullable=False))

    __table_args__ = (
        CheckConstraint(
            "freshness_status IN ('fresh', 'near_expiry', 'expired')",
            name="ck_recommendation_request_items_freshness_status",
        ),
    )
