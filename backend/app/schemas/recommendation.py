import uuid
from typing import Optional

from sqlmodel import SQLModel


class RecommendationCreate(SQLModel):
    session_id: uuid.UUID
    fridge_item_ids: list[uuid.UUID]


class RecommendedRecipe(SQLModel):
    id: uuid.UUID
    title: str
    cooking_time_min: int
    instructions: str
    matched_ingredients: list[str]
    missing_ingredients: list[str]
    safety_note: Optional[str] = None
    match_score: float


class RecommendationResponse(SQLModel):
    recommendation_id: uuid.UUID
    source: str
    cached: bool
    recipes: list[RecommendedRecipe]
