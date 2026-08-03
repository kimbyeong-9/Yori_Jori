import uuid

from fastapi import APIRouter, Depends, Query, Response, status
from sqlmodel import Session

from app.api.responses import FORBIDDEN, NOT_FOUND
from app.db.session import get_session
from app.models.fridge_item import FridgeItem
from app.models.ingredient import Ingredient
from app.schemas.fridge_item import FridgeItemCreate, FridgeItemRead, FridgeItemUpdate
from app.schemas.ingredient import IngredientRead
from app.services import fridge_service

router = APIRouter(prefix="/fridge-items", tags=["fridge-items"])


def _to_read(item: FridgeItem, ingredient: Ingredient) -> FridgeItemRead:
    return FridgeItemRead(
        id=item.id,
        ingredient=IngredientRead.model_validate(ingredient),
        quantity=item.quantity,
        input_method=item.input_method,
        freshness_status=item.freshness_status,
        food_expires_at=item.food_expires_at,
        action_due_at=item.action_due_at,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


@router.get(
    "",
    response_model=list[FridgeItemRead],
    responses={**NOT_FOUND},
    summary="냉장고 재료 목록",
    description="세션의 냉장고 재료를 최신 등록순으로 반환한다.",
)
def list_fridge_items(
    session_id: uuid.UUID = Query(..., description="조회할 세션 ID"),
    db: Session = Depends(get_session),
) -> list[FridgeItemRead]:
    pairs = fridge_service.list_fridge_items(db, session_id)
    return [_to_read(item, ingredient) for item, ingredient in pairs]


@router.post(
    "",
    response_model=FridgeItemRead,
    status_code=status.HTTP_201_CREATED,
    responses={**NOT_FOUND},
    summary="냉장고 재료 등록",
    description=(
        "freshness_status에 따라 action_due_at을 자동 계산한다: "
        "fresh→created_at+48h, near_expiry→created_at+24h, expired→null. "
        "실제 소비기한은 food_expires_at에 별도로 저장한다."
    ),
)
def create_fridge_item(
    payload: FridgeItemCreate, db: Session = Depends(get_session)
) -> FridgeItemRead:
    item, ingredient = fridge_service.create_fridge_item(
        db,
        session_id=payload.session_id,
        ingredient_id=payload.ingredient_id,
        quantity=payload.quantity,
        input_method=payload.input_method,
        freshness_status=payload.freshness_status,
        food_expires_at=payload.food_expires_at,
    )
    return _to_read(item, ingredient)


@router.patch(
    "/{fridge_item_id}",
    response_model=FridgeItemRead,
    responses={**NOT_FOUND, **FORBIDDEN},
    summary="냉장고 재료 수정",
    description=(
        "quantity/freshness_status/food_expires_at을 부분 수정한다. "
        "freshness_status가 바뀌면 action_due_at을 지금 시점 기준으로 다시 계산한다."
    ),
)
def update_fridge_item(
    fridge_item_id: uuid.UUID,
    payload: FridgeItemUpdate,
    session_id: uuid.UUID = Query(..., description="요청자의 세션 ID(소유권 검증)"),
    db: Session = Depends(get_session),
) -> FridgeItemRead:
    updates = payload.model_dump(exclude_unset=True)
    item, ingredient = fridge_service.update_fridge_item(
        db, fridge_item_id, session_id, updates
    )
    return _to_read(item, ingredient)


@router.delete(
    "/{fridge_item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={**NOT_FOUND, **FORBIDDEN},
    summary="냉장고 재료 삭제",
)
def delete_fridge_item(
    fridge_item_id: uuid.UUID,
    session_id: uuid.UUID = Query(..., description="요청자의 세션 ID(소유권 검증)"),
    db: Session = Depends(get_session),
) -> Response:
    fridge_service.delete_fridge_item(db, fridge_item_id, session_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
