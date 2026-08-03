import uuid
from datetime import datetime

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, SQLModel

from app.models.base import timestamp_field, uuid_pk_field


class SavedRecipe(SQLModel, table=True):
    __tablename__ = "saved_recipes"

    id: uuid.UUID = uuid_pk_field()
    session_id: uuid.UUID = Field(foreign_key="user_sessions.id", index=True)
    recipe_id: uuid.UUID = Field(foreign_key="recipes.id", index=True)
    created_at: datetime = timestamp_field()

    __table_args__ = (
        UniqueConstraint("session_id", "recipe_id", name="uq_saved_recipes_session_recipe"),
    )
