import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import CheckConstraint, Column, String
from sqlmodel import Field, SQLModel

from app.models.base import timestamp_field, uuid_pk_field
from app.models.enums import RecipeDifficulty


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
    # 아래 4개는 기존 레시피(과거 시드/캐시)와의 호환을 위해 전부 nullable이다.
    description: Optional[str] = Field(default=None)
    servings: Optional[int] = Field(default=None)
    difficulty: Optional[RecipeDifficulty] = Field(
        default=None, sa_column=Column(String, nullable=True)
    )
    tip: Optional[str] = Field(default=None)
    created_at: datetime = timestamp_field()

    __table_args__ = (
        CheckConstraint(
            "difficulty IS NULL OR difficulty IN ('easy', 'normal', 'hard')",
            name="ck_recipes_difficulty",
        ),
    )
