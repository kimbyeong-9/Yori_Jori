import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel

from app.models.base import timestamp_field, uuid_pk_field


class Recipe(SQLModel, table=True):
    __tablename__ = "recipes"

    id: uuid.UUID = uuid_pk_field()
    title: str
    source: str
    source_url: Optional[str] = Field(default=None)
    instructions: str
    cooking_time_min: int
    is_llm_generated: bool = Field(default=False)
    prompt_version: Optional[str] = Field(default=None)
    created_at: datetime = timestamp_field()
