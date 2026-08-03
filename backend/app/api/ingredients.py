from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.db.session import get_session
from app.schemas.ingredient import IngredientRead
from app.services import ingredient_service

router = APIRouter(prefix="/ingredients", tags=["ingredients"])


@router.get(
    "",
    response_model=list[IngredientRead],
    summary="재료 목록/검색",
    description="query(이름 부분일치), category(정확히 일치), top(Top10 재료만)으로 필터링한다.",
)
def list_ingredients(
    query: Optional[str] = Query(default=None, description="이름 부분 검색어"),
    category: Optional[str] = Query(default=None, description="카테고리 필터"),
    top: Optional[bool] = Query(default=None, description="Top10 재료만 조회"),
    db: Session = Depends(get_session),
) -> list[IngredientRead]:
    ingredients = ingredient_service.list_ingredients(
        db, query=query, category=category, top=top
    )
    return [IngredientRead.model_validate(ingredient) for ingredient in ingredients]
