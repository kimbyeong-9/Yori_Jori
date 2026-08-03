import uuid

from fastapi import APIRouter, Depends, Query, Response, status
from sqlmodel import Session

from app.api.responses import CONFLICT, FORBIDDEN, NOT_FOUND
from app.db.session import get_session
from app.schemas.recipe import RecipeSummary
from app.schemas.saved_recipe import SavedRecipeCreate, SavedRecipeListItem, SavedRecipeRead
from app.services import saved_recipe_service

router = APIRouter(prefix="/saved-recipes", tags=["saved-recipes"])


@router.get(
    "",
    response_model=list[SavedRecipeListItem],
    responses={**NOT_FOUND},
    summary="저장한 레시피 목록",
    description="세션이 저장한 레시피를 최근 저장순으로 반환한다.",
)
def list_saved_recipes(
    session_id: uuid.UUID = Query(..., description="조회할 세션 ID"),
    db: Session = Depends(get_session),
) -> list[SavedRecipeListItem]:
    pairs = saved_recipe_service.list_saved_recipes(db, session_id)
    return [
        SavedRecipeListItem(
            id=saved.id,
            recipe=RecipeSummary.model_validate(recipe),
            created_at=saved.created_at,
        )
        for saved, recipe in pairs
    ]


@router.post(
    "",
    response_model=SavedRecipeRead,
    status_code=status.HTTP_201_CREATED,
    responses={**NOT_FOUND, **CONFLICT},
    summary="레시피 저장",
    description="이미 저장된 (session_id, recipe_id) 조합이면 409를 반환한다.",
)
def create_saved_recipe(
    payload: SavedRecipeCreate, db: Session = Depends(get_session)
) -> SavedRecipeRead:
    saved = saved_recipe_service.create_saved_recipe(
        db, payload.session_id, payload.recipe_id
    )
    return SavedRecipeRead.model_validate(saved)


@router.delete(
    "/{recipe_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={**NOT_FOUND, **FORBIDDEN},
    summary="레시피 저장 취소",
    description=(
        "다른 세션이 저장한 레시피면 403, 아무도 저장하지 않았으면 404를 반환한다."
    ),
)
def delete_saved_recipe(
    recipe_id: uuid.UUID,
    session_id: uuid.UUID = Query(..., description="요청자의 세션 ID(소유권 검증)"),
    db: Session = Depends(get_session),
) -> Response:
    saved_recipe_service.delete_saved_recipe(db, session_id, recipe_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
