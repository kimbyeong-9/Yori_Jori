import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Column, DateTime
from sqlmodel import Field, SQLModel

from app.models.base import timestamp_field, uuid_pk_field


class CookSession(SQLModel, table=True):
    __tablename__ = "cook_sessions"

    id: uuid.UUID = uuid_pk_field()
    session_id: uuid.UUID = Field(foreign_key="user_sessions.id", index=True)
    recipe_id: uuid.UUID = Field(foreign_key="recipes.id", index=True)
    started_at: datetime = timestamp_field()
    completed_at: Optional[datetime] = Field(
        default=None, sa_column=Column(DateTime(timezone=True), nullable=True)
    )
