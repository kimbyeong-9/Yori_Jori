import uuid

from sqlmodel import SQLModel


class IngredientCreate(SQLModel):
    name: str
    category: str
    unit: str


class IngredientCreateRequest(SQLModel):
    """POST /api/v1/ingredients 요청 — category/unit은 Gemini 검증으로 서버가 정한다."""

    name: str


class IngredientRead(SQLModel):
    id: uuid.UUID
    name: str
    category: str
    unit: str
    is_top: bool
