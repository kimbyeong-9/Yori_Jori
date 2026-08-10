import json
from pathlib import Path
from typing import Optional

import httpx
from pydantic import ValidationError as PydanticValidationError
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session

from app.core.config import settings
from app.core.errors import ExternalServiceError, ValidationError
from app.integrations.gemini_client import (
    GeminiInvalidResponseError,
    GeminiRequestError,
    GeminiTimeoutError,
    call_gemini,
)
from app.models.ingredient import Ingredient
from app.repositories import ingredient_repo
from app.schemas.gemini import GeminiIngredientValidation
from app.services.ingredient_normalization import normalize_ingredient_name

_INGREDIENT_RESPONSE_SCHEMA: dict = {
    "type": "OBJECT",
    "properties": {
        "is_edible": {"type": "BOOLEAN"},
        "category": {"type": "STRING"},
        "unit": {"type": "STRING"},
        "reason": {"type": "STRING"},
    },
    "required": ["is_edible", "category", "unit", "reason"],
}

_VALIDATION_PROMPT_PATH = (
    Path(__file__).resolve().parent.parent / "prompts" / "ingredient_validation_v1.txt"
)

_UNAVAILABLE_MESSAGE = "지금은 재료를 확인할 수 없어요. 잠시 후 다시 시도해주세요."


def list_ingredients(
    db: Session,
    query: Optional[str] = None,
    category: Optional[str] = None,
    top: Optional[bool] = None,
) -> list[Ingredient]:
    return ingredient_repo.list_ingredients(db, query=query, category=category, top=top)


def _build_validation_prompt(name: str, categories: list[str]) -> str:
    categories_block = "\n".join(f"- {category}" for category in categories)
    template = _VALIDATION_PROMPT_PATH.read_text(encoding="utf-8")
    return template.format(name=name, categories_block=categories_block)


async def create_ingredient(
    db: Session, http_client: httpx.AsyncClient, *, name: str
) -> tuple[Ingredient, bool]:
    """이름만으로 재료를 등록한다(DL-007, 자유 등록 허용).

    이미 마스터에 있으면 그 재료를 그대로 재사용한다(반환값의 두 번째 항목이 False).
    없으면 Gemini로 식용 여부/카테고리/단위를 검증한 뒤 생성한다(반환값 True). Gemini
    호출 자체가 실패하면(타임아웃/오류/응답 파싱 실패) 검증 없이 만들지 않고
    ExternalServiceError(503)를 던진다 — 재료 마스터의 정확성이 가용성보다
    중요하다고 판단한 fail-closed 정책이다(docs/decision-log.md DL-007).
    """
    normalized_name = normalize_ingredient_name(name)
    existing = ingredient_repo.get_by_normalized_name(db, normalized_name)
    if existing is not None:
        return existing, False

    categories = ingredient_repo.list_categories(db)
    prompt = _build_validation_prompt(name, categories)

    try:
        raw_text = await call_gemini(
            http_client,
            prompt=prompt,
            model_name=settings.gemini_model,
            api_key=settings.gemini_api_key,
            response_schema=_INGREDIENT_RESPONSE_SCHEMA,
            timeout_seconds=settings.gemini_timeout_seconds,
        )
    except (GeminiTimeoutError, GeminiRequestError, GeminiInvalidResponseError) as exc:
        raise ExternalServiceError(_UNAVAILABLE_MESSAGE) from exc

    try:
        raw_data = json.loads(raw_text)
        validation = GeminiIngredientValidation.model_validate(raw_data)
    except (json.JSONDecodeError, PydanticValidationError, TypeError) as exc:
        raise ExternalServiceError(_UNAVAILABLE_MESSAGE) from exc

    if not validation.is_edible:
        raise ValidationError("식용 식재료로 인식되지 않습니다.")

    try:
        ingredient = ingredient_repo.create(
            db,
            name=name,
            normalized_name=normalized_name,
            category=validation.category,
            unit=validation.unit,
        )
        db.commit()
    except IntegrityError:
        # 같은 재료명으로 거의 동시에 두 요청이 들어오면(DL-014/DL-018과 동일한 패턴)
        # 둘 다 "없음"을 보고 Gemini 검증까지 마친 뒤 INSERT를 시도할 수 있다. 롤백 후
        # 이미 커밋된 행을 재사용한다.
        db.rollback()
        existing = ingredient_repo.get_by_normalized_name(db, normalized_name)
        if existing is None:
            raise
        return existing, False

    return ingredient, True
