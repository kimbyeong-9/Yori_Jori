import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel


class SessionCreate(SQLModel):
    browser_uuid: uuid.UUID
    user_agent: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "browser_uuid": "a1b2c3d4-0000-4000-8000-000000000001",
                "user_agent": "Mozilla/5.0",
            }
        }
    }


class SessionRead(SQLModel):
    session_id: uuid.UUID
    anonymous_user_id: uuid.UUID
    created_at: datetime
    expires_at: datetime
