import httpx
from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.api.responses import FORBIDDEN, NOT_FOUND
from app.db.session import get_session
from app.integrations.gemini_client import get_http_client
from app.schemas.recommendation import (
    RecommendationCreate,
    RecommendationResponse,
    RecommendedRecipe,
)
from app.services import recommendation_service

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.post(
    "",
    response_model=RecommendationResponse,
    responses={**NOT_FOUND, **FORBIDDEN},
    summary="레시피 추천",
    description=(
        "냉장고 재료(fridge_item_ids)로 DB 레시피를 먼저 매칭한다(near_expiry 재료를 쓰면 "
        "가중치를 더 준다). 충분한 매칭이 없으면 ingredients_hash로 llm_cache를 조회하고, "
        "없으면 Gemini를 호출해 구조화된 레시피를 받아 Pydantic으로 검증한 뒤 recipes/"
        "recipe_ingredients에 저장한다. Gemini 타임아웃/오류/잘못된 응답이면 캐시에 쓰지 "
        "않고 DB 추천 결과로 폴백한다 — 이 엔드포인트는 항상 200과 (비어있을 수 있는) "
        "recipes 배열을 반환하며 외부 API 실패로 500이 되지 않는다."
    ),
)
async def create_recommendation(
    payload: RecommendationCreate,
    db: Session = Depends(get_session),
    http_client: httpx.AsyncClient = Depends(get_http_client),
) -> RecommendationResponse:
    result = await recommendation_service.create_recommendation(
        db,
        http_client,
        session_id=payload.session_id,
        fridge_item_ids=payload.fridge_item_ids,
    )
    return RecommendationResponse(
        recommendation_id=result.recommendation_id,
        source=result.source,
        cached=result.cached,
        recipes=[
            RecommendedRecipe(
                id=r.recipe_id,
                title=r.title,
                cooking_time_min=r.cooking_time_min,
                instructions=r.instructions,
                matched_ingredients=r.matched_ingredient_names,
                missing_ingredients=r.missing_ingredient_names,
                safety_note=r.safety_note,
                match_score=r.match_score,
            )
            for r in result.recipes
        ],
    )
