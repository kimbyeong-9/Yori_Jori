import uuid
from typing import Optional

from sqlmodel import Session, select

from app.models.ingredient import Ingredient


def get(db: Session, ingredient_id: uuid.UUID) -> Optional[Ingredient]:
    return db.get(Ingredient, ingredient_id)


def get_many(db: Session, ingredient_ids: set[uuid.UUID]) -> list[Ingredient]:
    if not ingredient_ids:
        return []
    stmt = select(Ingredient).where(Ingredient.id.in_(ingredient_ids))
    return list(db.exec(stmt).all())


def get_by_normalized_name(db: Session, normalized_name: str) -> Optional[Ingredient]:
    stmt = select(Ingredient).where(Ingredient.normalized_name == normalized_name)
    return db.exec(stmt).first()


def list_categories(db: Session) -> list[str]:
    stmt = select(Ingredient.category).distinct().order_by(Ingredient.category)
    return list(db.exec(stmt).all())


def create(
    db: Session, *, name: str, normalized_name: str, category: str, unit: str
) -> Ingredient:
    ingredient = Ingredient(
        name=name, normalized_name=normalized_name, category=category, unit=unit
    )
    db.add(ingredient)
    db.flush()
    return ingredient


def list_ingredients(
    db: Session,
    query: Optional[str] = None,
    category: Optional[str] = None,
    top: Optional[bool] = None,
) -> list[Ingredient]:
    stmt = select(Ingredient)
    if query:
        stmt = stmt.where(Ingredient.name.ilike(f"%{query}%"))
    if category:
        stmt = stmt.where(Ingredient.category == category)
    if top is not None:
        stmt = stmt.where(Ingredient.is_top == top)
    stmt = stmt.order_by(Ingredient.name)
    return list(db.exec(stmt).all())
