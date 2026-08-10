from typing import Literal, Optional

from pydantic import BaseModel


class GeminiIngredientValidation(BaseModel):
    """재료 자유 등록(POST /api/v1/ingredients) 검증용 스키마 (CLAUDE.md 규칙 8, DL-007).

    is_edible이 false거나 응답이 이 스키마를 통과하지 못하면 등록을 거부한다.
    """

    is_edible: bool
    category: str
    unit: str
    reason: Optional[str] = None


class GeminiRecipeItem(BaseModel):
    """Gemini 구조화 출력 검증용 스키마 (CLAUDE.md 규칙 8).

    필드가 하나라도 없거나 타입이 안 맞으면 pydantic.ValidationError가 나고,
    호출부(recommendation_service)는 이를 '잘못된 응답'으로 취급해 DB 추천으로 폴백한다.
    """

    title: str
    cooking_time_min: int
    servings: int
    difficulty: Literal["easy", "normal", "hard"]
    description: str
    ingredients: list[str]
    matched_ingredients: list[str]
    missing_ingredients: list[str]
    instructions: str
    tip: str
    safety_note: str
