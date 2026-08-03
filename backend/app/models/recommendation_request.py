import uuid
from datetime import datetime

from sqlmodel import Field, SQLModel

from app.models.base import timestamp_field, uuid_pk_field


class RecommendationRequest(SQLModel, table=True):
    __tablename__ = "recommendation_requests"

    id: uuid.UUID = uuid_pk_field()
    session_id: uuid.UUID = Field(foreign_key="user_sessions.id", index=True)
    ingredients_hash: str = Field(index=True)
    source: str
    created_at: datetime = timestamp_field()
