import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel

from app.models.base import timestamp_field, uuid_pk_field


class AnonymousUser(SQLModel, table=True):
    __tablename__ = "anonymous_users"

    id: uuid.UUID = uuid_pk_field()
    browser_uuid: uuid.UUID = Field(unique=True, index=True)
    user_agent: Optional[str] = Field(default=None)
    created_at: datetime = timestamp_field()
    last_seen_at: datetime = timestamp_field()
