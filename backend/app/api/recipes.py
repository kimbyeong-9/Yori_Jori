import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlmodel import Session

from app.api.responses import NOT_FOUND
from app.db.session import get_session
from app.schemas.cook_session import CookSessionCreate, CookSessionStartResponse
from app.schemas.ingredient import IngredientRead
from app.schemas.recipe import RecipeIngredientRead, RecipeRead, RecipeSummary
from app.services import cook_session_service, recipe_service

router = APIRouter(prefix="/recipes", tags=["recipes"])


# NOTE: /recent를 /{recipe_id}보다 먼저 등록해야 한다. 순서가 바뀌면 "recent"가
# {recipe_id}(UUID)로 파싱되려다 422를 내며 이 라우트에 절대 도달하지 못한다.
@router.get(
    "/recent",
    response_model=list[RecipeSummary],
    summary="최근 본 레시피",
    description=(
        "해당 세션의 recipe_detail_view 또는 recipe_click 로그를 기준으로, "
        "레시피별 가장 최근 조회 시각 순으로(중복 제거) 반환한다."
    ),
)
def list_recent_recipes(
    session_id: uuid.UUID = Query(..., description="조회할 세션 ID"),
    db: Session = Depends(get_session),
) -> list[RecipeSummary]:
    recipes = recipe_service.list_recent_recipes(db, session_id)
    return [RecipeSummary.model_validate(recipe) for recipe in recipes]


@router.get(
    "/{recipe_id}",
    response_model=RecipeRead,
    responses={**NOT_FOUND},
    summary="레시피 상세",
    description="레시피 단건과 필요한 재료 목록(마스터 재료 정보 포함)을 조회한다.",
)
def get_recipe(recipe_id: uuid.UUID, db: Session = Depends(get_session)) -> RecipeRead:
    recipe = recipe_service.get_recipe(db, recipe_id)
    ingredient_pairs = recipe_service.get_recipe_ingredients(db, recipe_id)
    return RecipeRead(
        id=recipe.id,
        title=recipe.title,
        source=recipe.source,
        source_url=recipe.source_url,
        instructions=recipe.instructions,
        cooking_time_min=recipe.cooking_time_min,
        is_llm_generated=recipe.is_llm_generated,
        created_at=recipe.created_at,
        ingredients=[
            RecipeIngredientRead(
                ingredient=IngredientRead.model_validate(ingredient),
                quantity=recipe_ingredient.quantity,
                is_optional=recipe_ingredient.is_optional,
            )
            for recipe_ingredient, ingredient in ingredient_pairs
        ],
    )


@router.post(
    "/{recipe_id}/cook-sessions",
    response_model=CookSessionStartResponse,
    status_code=status.HTTP_201_CREATED,
    responses={**NOT_FOUND},
    summary="조리 시작",
    description="이 레시피로 조리를 시작한다. recipe_start 이벤트의 cook_session_id로 쓰인다.",
)
def start_cook_session(
    recipe_id: uuid.UUID,
    payload: CookSessionCreate,
    db: Session = Depends(get_session),
) -> CookSessionStartResponse:
    cook_session = cook_session_service.start_cooking(
        db, session_id=payload.session_id, recipe_id=recipe_id
    )
    return CookSessionStartResponse(
        cook_session_id=cook_session.id, started_at=cook_session.started_at
    )
