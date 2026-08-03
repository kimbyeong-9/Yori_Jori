import uuid
from typing import Optional

from sqlmodel import Session, select

from app.models.saved_recipe import SavedRecipe


def get_by_session_and_recipe(
    db: Session, session_id: uuid.UUID, recipe_id: uuid.UUID
) -> Optional[SavedRecipe]:
    stmt = (
        select(SavedRecipe)
        .where(SavedRecipe.session_id == session_id)
        .where(SavedRecipe.recipe_id == recipe_id)
    )
    return db.exec(stmt).first()


def get_any_by_recipe(db: Session, recipe_id: uuid.UUID) -> Optional[SavedRecipe]:
    """세션 무관하게 해당 recipe_id로 저장된 row가 있는지 확인한다.

    DELETE /api/v1/saved-recipes/{recipe_id}에서 '다른 세션이 저장함'(403)과
    '아무도 저장 안 함'(404)을 구분하기 위해 쓴다.
    """
    stmt = select(SavedRecipe).where(SavedRecipe.recipe_id == recipe_id)
    return db.exec(stmt).first()


def list_by_session(db: Session, session_id: uuid.UUID) -> list[SavedRecipe]:
    stmt = (
        select(SavedRecipe)
        .where(SavedRecipe.session_id == session_id)
        .order_by(SavedRecipe.created_at.desc())
    )
    return list(db.exec(stmt).all())


def create(db: Session, saved_recipe: SavedRecipe) -> SavedRecipe:
    db.add(saved_recipe)
    db.flush()
    return saved_recipe


def delete(db: Session, saved_recipe: SavedRecipe) -> None:
    db.delete(saved_recipe)
    db.flush()
