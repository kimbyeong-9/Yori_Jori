import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel

from app.schemas.ingredient import IngredientRead


class RecipeSummary(SQLModel):
    id: uuid.UUID
    title: str
    cooking_time_min: int


class RecipeIngredientRead(SQLModel):
    ingredient: IngredientRead
    quantity: str
    is_optional: bool


class RecipeRead(SQLModel):
    id: uuid.UUID
    title: str
    source: str
    source_url: Optional[str]
    instructions: str
    cooking_time_min: int
    is_llm_generated: bool
    created_at: datetime
    description: Optional[str]
    servings: Optional[int]
    difficulty: Optional[str]
    tip: Optional[str]
    ingredients: list[RecipeIngredientRead]
