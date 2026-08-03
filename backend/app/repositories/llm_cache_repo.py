from typing import Any, Optional

from sqlmodel import Session, select

from app.models.llm_cache import LLMCache


def get_by_hash(db: Session, ingredients_hash: str) -> Optional[LLMCache]:
    stmt = select(LLMCache).where(LLMCache.ingredients_hash == ingredients_hash)
    return db.exec(stmt).first()


def create(
    db: Session,
    *,
    ingredients_hash: str,
    response_text: str,
    parsed_recipes: Any,
    prompt_version: str,
    model_name: str,
) -> LLMCache:
    cache_row = LLMCache(
        ingredients_hash=ingredients_hash,
        response_text=response_text,
        parsed_recipes=parsed_recipes,
        hit_count=0,
        prompt_version=prompt_version,
        model_name=model_name,
    )
    db.add(cache_row)
    db.flush()
    return cache_row


def increment_hit(db: Session, cache_row: LLMCache) -> LLMCache:
    cache_row.hit_count += 1
    db.add(cache_row)
    db.flush()
    return cache_row
