import uuid
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel

from app.models.base import timestamp_field, uuid_pk_field


class InteractionLog(SQLModel, table=True):
    __tablename__ = "interaction_logs"

    id: uuid.UUID = uuid_pk_field()
    session_id: uuid.UUID = Field(foreign_key="user_sessions.id", index=True)
    recipe_id: Optional[uuid.UUID] = Field(default=None, foreign_key="recipes.id", index=True)
    # docs/event-taxonomy.md에 정의된 이벤트명만 허용되어야 하지만, 그 검증은
    # 이벤트 수집 API(BL-02)에서 담당한다. 이 테이블은 값을 임의로 제한하지 않는다.
    event_type: str = Field(index=True)
    # DB 컬럼명은 명세대로 "metadata"지만, SQLAlchemy/SQLModel이 클래스 속성명
    # "metadata"를 MetaData 인스턴스용으로 예약하고 있어 Python 속성명은
    # event_metadata로 두고 실제 컬럼명만 "metadata"로 매핑한다.
    event_metadata: dict[str, Any] = Field(
        default_factory=dict, sa_column=Column("metadata", JSONB, nullable=False)
    )
    created_at: datetime = timestamp_field(index=True)
