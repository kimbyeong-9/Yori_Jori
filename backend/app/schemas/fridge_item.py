import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel

from app.models.enums import FreshnessStatus
from app.schemas.ingredient import IngredientRead


class FridgeItemCreate(SQLModel):
    session_id: uuid.UUID
    ingredient_id: uuid.UUID
    quantity: Optional[str] = None
    input_method: str
    freshness_status: FreshnessStatus
    food_expires_at: Optional[datetime] = None


class FridgeItemUpdate(SQLModel):
    quantity: Optional[str] = None
    freshness_status: Optional[FreshnessStatus] = None
    food_expires_at: Optional[datetime] = None


class FridgeItemRead(SQLModel):
    id: uuid.UUID
    ingredient: IngredientRead
    quantity: Optional[str]
    input_method: str
    freshness_status: FreshnessStatus
    food_expires_at: Optional[datetime]
    action_due_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
