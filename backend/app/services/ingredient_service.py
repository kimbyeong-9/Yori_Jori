from typing import Optional

from sqlmodel import Session

from app.models.ingredient import Ingredient
from app.repositories import ingredient_repo


def list_ingredients(
    db: Session,
    query: Optional[str] = None,
    category: Optional[str] = None,
    top: Optional[bool] = None,
) -> list[Ingredient]:
    return ingredient_repo.list_ingredients(db, query=query, category=category, top=top)
