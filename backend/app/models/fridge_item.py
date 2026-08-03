import uuid
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import CheckConstraint, Column, DateTime, String
from sqlmodel import Field, SQLModel

from app.models.base import timestamp_field, uuid_pk_field
from app.models.enums import FreshnessStatus
from app.services.freshness import compute_action_due_at


class FridgeItem(SQLModel, table=True):
    __tablename__ = "fridge_items"

    id: uuid.UUID = uuid_pk_field()
    session_id: uuid.UUID = Field(foreign_key="user_sessions.id", index=True)
    ingredient_id: uuid.UUID = Field(foreign_key="ingredients.id", index=True)
    quantity: Optional[str] = Field(default=None)
    input_method: str
    freshness_status: FreshnessStatus = Field(sa_column=Column(String, nullable=False))
    food_expires_at: Optional[datetime] = Field(
        default=None, sa_column=Column(DateTime(timezone=True), nullable=True)
    )
    # 신선도 상태에 따라 자동 계산됨 (app.services.freshness.compute_action_due_at).
    # 실제 소비기한(food_expires_at)과는 별개의, 서비스 행동 유도용 기한이다.
    action_due_at: Optional[datetime] = Field(
        default=None, sa_column=Column(DateTime(timezone=True), nullable=True)
    )
    created_at: datetime = timestamp_field()
    updated_at: datetime = timestamp_field(onupdate=True)

    __table_args__ = (
        CheckConstraint(
            "freshness_status IN ('fresh', 'near_expiry', 'expired')",
            name="ck_fridge_items_freshness_status",
        ),
    )

    def __init__(self, **data: Any) -> None:
        # SQLModel의 table=True 모델은 declarative 생성자를 사용해 pydantic
        # model_validator가 인스턴스 생성 시 호출되지 않는다. 그래서 __init__을
        # 직접 오버라이드해 action_due_at을 항상 freshness_status/created_at으로부터
        # 파생시킨다. (DB에서 기존 row를 로드할 때는 SQLAlchemy가 __init__을 호출하지
        # 않으므로 저장된 값이 그대로 유지된다.)
        # 신선도 변경 시 created_at 기준을 유지할지, 변경 시점 기준으로 재계산할지는
        # 아직 미정 (docs/decision-log.md DL-010, Open).
        super().__init__(**data)
        self.action_due_at = compute_action_due_at(self.freshness_status, self.created_at)
