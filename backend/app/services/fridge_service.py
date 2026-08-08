import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from sqlmodel import Session

from app.core.errors import ForbiddenError, NotFoundError
from app.models.enums import FreshnessStatus
from app.models.fridge_item import FridgeItem
from app.models.ingredient import Ingredient
from app.repositories import fridge_item_repo, ingredient_repo, user_session_repo
from app.services.freshness import compute_action_due_at


def _require_session(db: Session, session_id: uuid.UUID) -> None:
    if user_session_repo.get(db, session_id) is None:
        raise NotFoundError("세션을 찾을 수 없습니다.")


def _get_owned_fridge_item(
    db: Session, fridge_item_id: uuid.UUID, session_id: uuid.UUID
) -> FridgeItem:
    item = fridge_item_repo.get(db, fridge_item_id)
    if item is None:
        raise NotFoundError("냉장고 재료를 찾을 수 없습니다.")
    if item.session_id != session_id:
        raise ForbiddenError("다른 세션의 냉장고 재료에 접근할 수 없습니다.")
    return item


def list_fridge_items(
    db: Session, session_id: uuid.UUID
) -> list[tuple[FridgeItem, Ingredient]]:
    _require_session(db, session_id)
    # action_due_at이 지난 항목은 조회 시점에 자동으로 삭제한다(lazy cleanup).
    # 별도 스케줄러/cron 없이, 이 세션이 냉장고 목록을 조회할 때마다 정리된다.
    fridge_item_repo.delete_expired(db, session_id)
    db.commit()
    items = fridge_item_repo.list_by_session(db, session_id)
    ingredients = {
        ing.id: ing for ing in ingredient_repo.get_many(db, {i.ingredient_id for i in items})
    }
    return [(item, ingredients[item.ingredient_id]) for item in items]


def create_fridge_item(
    db: Session,
    session_id: uuid.UUID,
    ingredient_id: uuid.UUID,
    quantity: Optional[str],
    input_method: str,
    freshness_status: FreshnessStatus,
    food_expires_at: Optional[datetime],
) -> tuple[FridgeItem, Ingredient]:
    _require_session(db, session_id)
    ingredient = ingredient_repo.get(db, ingredient_id)
    if ingredient is None:
        raise NotFoundError("재료를 찾을 수 없습니다.")

    item = FridgeItem(
        session_id=session_id,
        ingredient_id=ingredient_id,
        quantity=quantity,
        input_method=input_method,
        freshness_status=freshness_status,
        food_expires_at=food_expires_at,
    )
    fridge_item_repo.create(db, item)
    db.commit()
    return item, ingredient


def update_fridge_item(
    db: Session,
    fridge_item_id: uuid.UUID,
    session_id: uuid.UUID,
    updates: dict[str, Any],
) -> tuple[FridgeItem, Ingredient]:
    item = _get_owned_fridge_item(db, fridge_item_id, session_id)

    if "quantity" in updates:
        item.quantity = updates["quantity"]
    if "food_expires_at" in updates:
        item.food_expires_at = updates["food_expires_at"]
    if "freshness_status" in updates:
        # docs/decision-log.md DL-010 (2026-07-31 확정): freshness_status를 바꾸면
        # action_due_at은 원래 created_at이 아니라 "지금"을 기준으로 다시 계산한다.
        item.freshness_status = updates["freshness_status"]
        item.action_due_at = compute_action_due_at(
            item.freshness_status, datetime.now(timezone.utc)
        )

    fridge_item_repo.save(db, item)
    db.commit()
    ingredient = ingredient_repo.get(db, item.ingredient_id)
    assert ingredient is not None  # FK 제약상 항상 존재
    return item, ingredient


def delete_fridge_item(db: Session, fridge_item_id: uuid.UUID, session_id: uuid.UUID) -> None:
    item = _get_owned_fridge_item(db, fridge_item_id, session_id)
    fridge_item_repo.delete(db, item)
    db.commit()
