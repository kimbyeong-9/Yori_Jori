import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel

from app.models.base import timestamp_field, uuid_pk_field


class LLMCache(SQLModel, table=True):
    __tablename__ = "llm_cache"

    id: uuid.UUID = uuid_pk_field()
    ingredients_hash: str = Field(unique=True, index=True)
    response_text: str
    parsed_recipes: Any = Field(sa_column=Column(JSONB, nullable=False))
    hit_count: int = Field(default=0)
    prompt_version: str
    model_name: str
    created_at: datetime = timestamp_field()
    updated_at: datetime = timestamp_field(onupdate=True)
