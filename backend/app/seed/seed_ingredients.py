import pandas as pd
from sqlmodel import Session, select

from app.models.ingredient import Ingredient
from app.services.ingredient_normalization import normalize_ingredient_name

TOP_INGREDIENTS = [
    {"name": "대파", "category": "채소", "unit": "대"},
    {"name": "양파", "category": "채소", "unit": "개"},
    {"name": "계란", "category": "축산물", "unit": "개"},
    {"name": "두부", "category": "가공식품", "unit": "모"},
    {"name": "마늘", "category": "채소", "unit": "g"},
    {"name": "김치", "category": "가공식품", "unit": "g"},
    {"name": "돼지고기", "category": "육류", "unit": "g"},
    {"name": "감자", "category": "채소", "unit": "개"},
    {"name": "당근", "category": "채소", "unit": "개"},
    {"name": "애호박", "category": "채소", "unit": "개"},
]


def seed_top_ingredients(session: Session) -> list[Ingredient]:
    """Top 10 식재료를 idempotent하게 시드한다.

    실제 재료 마스터 데이터 출처는 아직 미정이라(docs/decision-log.md DL-006),
    지금은 코드 내 리스트를 pandas DataFrame으로 구성해 사용한다. 소스가 정해지면
    이 DataFrame을 pandas.read_excel(...) 결과로 교체하면 된다.
    """
    df = pd.DataFrame(TOP_INGREDIENTS)
    seeded: list[Ingredient] = []
    for row in df.to_dict("records"):
        normalized_name = normalize_ingredient_name(row["name"])
        existing = session.exec(
            select(Ingredient).where(Ingredient.normalized_name == normalized_name)
        ).first()
        if existing:
            seeded.append(existing)
            continue
        ingredient = Ingredient(
            name=row["name"],
            normalized_name=normalized_name,
            category=row["category"],
            unit=row["unit"],
            is_top=True,
        )
        session.add(ingredient)
        session.flush()
        seeded.append(ingredient)
    session.commit()
    return seeded
