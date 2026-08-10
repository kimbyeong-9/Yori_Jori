from typing import Optional

import httpx
from fastapi import APIRouter, Depends, Query, Response, status
from sqlmodel import Session

from app.api.responses import EXTERNAL_SERVICE_UNAVAILABLE, INVALID_REQUEST
from app.db.session import get_session
from app.integrations.gemini_client import get_http_client
from app.schemas.ingredient import IngredientCreateRequest, IngredientRead
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


@router.post(
    "",
    response_model=IngredientRead,
    responses={**INVALID_REQUEST, **EXTERNAL_SERVICE_UNAVAILABLE},
    summary="재료 자유 등록",
    description=(
        "마스터에 없는 재료 이름을 등록한다(DL-007). 이미 같은 이름(정규화 기준)의 재료가 "
        "있으면 새로 만들지 않고 그 재료를 200으로 반환한다. 신규 등록은 Gemini로 식용 "
        "여부/카테고리/단위를 검증한 뒤 통과한 것만 201로 생성한다 — 식용으로 인식되지 "
        "않으면 400, Gemini 호출 자체가 실패하면(타임아웃/오류) 만들지 않고 503을 반환한다."
    ),
)
async def create_ingredient(
    payload: IngredientCreateRequest,
    response: Response,
    db: Session = Depends(get_session),
    http_client: httpx.AsyncClient = Depends(get_http_client),
) -> IngredientRead:
    ingredient, created = await ingredient_service.create_ingredient(
        db, http_client, name=payload.name
    )
    response.status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
    return IngredientRead.model_validate(ingredient)
