import uuid
from typing import Any, Optional

from pydantic import Field
from sqlmodel import SQLModel


class EventCreate(SQLModel):
    session_id: uuid.UUID
    event_type: str
    recipe_id: Optional[uuid.UUID] = None
    # SQLModel/SQLAlchemy가 클래스 속성명 "metadata"를 예약하고 있어(경고 발생),
    # Python 속성명은 event_metadata로 두고 alias="metadata"로 JSON 키는 그대로
    # "metadata"를 사용하도록 한다 (interaction_logs.event_metadata와 동일한 패턴).
    event_metadata: dict[str, Any] = Field(default_factory=dict, alias="metadata")

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "session_id": "a1b2c3d4-0000-4000-8000-000000000002",
                "event_type": "recipe_click",
                "recipe_id": "a1b2c3d4-0000-4000-8000-000000000003",
                "metadata": {"position": 1},
            }
        },
    }
