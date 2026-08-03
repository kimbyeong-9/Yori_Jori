import uuid
from datetime import datetime

from sqlmodel import SQLModel

from app.schemas.recipe import RecipeSummary


class SavedRecipeCreate(SQLModel):
    session_id: uuid.UUID
    recipe_id: uuid.UUID


class SavedRecipeRead(SQLModel):
    id: uuid.UUID
    recipe_id: uuid.UUID
    created_at: datetime


class SavedRecipeListItem(SQLModel):
    id: uuid.UUID
    recipe: RecipeSummary
    created_at: datetime
