from typing import Literal

from pydantic import BaseModel


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
