import uuid
from typing import Optional

from sqlmodel import Session, select

from app.models.fridge_item import FridgeItem


def get(db: Session, fridge_item_id: uuid.UUID) -> Optional[FridgeItem]:
    return db.get(FridgeItem, fridge_item_id)


def get_many(db: Session, fridge_item_ids: set[uuid.UUID]) -> list[FridgeItem]:
    if not fridge_item_ids:
        return []
    stmt = select(FridgeItem).where(FridgeItem.id.in_(fridge_item_ids))
    return list(db.exec(stmt).all())


def list_by_session(db: Session, session_id: uuid.UUID) -> list[FridgeItem]:
    stmt = (
        select(FridgeItem)
        .where(FridgeItem.session_id == session_id)
        .order_by(FridgeItem.created_at.desc())
    )
    return list(db.exec(stmt).all())


def create(db: Session, fridge_item: FridgeItem) -> FridgeItem:
    db.add(fridge_item)
    db.flush()
    return fridge_item


def save(db: Session, fridge_item: FridgeItem) -> FridgeItem:
    db.add(fridge_item)
    db.flush()
    return fridge_item


def delete(db: Session, fridge_item: FridgeItem) -> None:
    db.delete(fridge_item)
    db.flush()
