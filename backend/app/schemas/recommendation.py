import uuid
from typing import Optional

from sqlmodel import SQLModel


class RecommendationCreate(SQLModel):
    session_id: uuid.UUID
    fridge_item_ids: list[uuid.UUID]


class RecipeSearchCreate(SQLModel):
    session_id: uuid.UUID
    ingredient_names: list[str]


class RecommendedRecipe(SQLModel):
    id: uuid.UUID
    title: str
    cooking_time_min: int
    instructions: str
    matched_ingredients: list[str]
    missing_ingredients: list[str]
    safety_note: Optional[str] = None
    match_score: float
    description: Optional[str] = None
    servings: Optional[int] = None
    difficulty: Optional[str] = None
    tip: Optional[str] = None


class RecommendationResponse(SQLModel):
    recommendation_id: uuid.UUID
    source: str
    cached: bool
    recipes: list[RecommendedRecipe]
