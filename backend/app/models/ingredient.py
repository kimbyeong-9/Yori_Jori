import uuid
from datetime import datetime

from sqlmodel import Field, SQLModel

from app.models.base import timestamp_field, uuid_pk_field


class Ingredient(SQLModel, table=True):
    __tablename__ = "ingredients"

    id: uuid.UUID = uuid_pk_field()
    name: str
    normalized_name: str = Field(unique=True, index=True)
    category: str
    unit: str
    is_top: bool = Field(default=False, index=True)
    created_at: datetime = timestamp_field()
