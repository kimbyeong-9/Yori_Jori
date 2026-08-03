import uuid

from sqlmodel import SQLModel


class IngredientCreate(SQLModel):
    name: str
    category: str
    unit: str


class IngredientRead(SQLModel):
    id: uuid.UUID
    name: str
    category: str
    unit: str
    is_top: bool
