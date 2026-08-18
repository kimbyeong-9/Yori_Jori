from sqlmodel import Session, select

from app.models.ingredient import Ingredient
from app.models.recipe import Recipe
from app.models.recipe_ingredient import RecipeIngredient
from app.services.ingredient_normalization import normalize_ingredient_name

# Gemini 장애 시에도 DB 매칭만으로 검색 결과가 나올 수 있도록, 시드 재료
# 10개(대파/양파/계란/두부/마늘/김치/돼지고기/감자/당근/애호박) 조합으로 만든
# 한국 가정식 레시피 세트(2026-08-18, DB 폴백 커버리지 보강).
RECIPE_SEEDS: list[dict] = [
    {
        "title": "계란볶음밥",
        "instructions": (
            "1. 밥과 채소를 잘게 썬다.\n"
            "2. 팬에 기름을 두르고 채소를 볶는다.\n"
            "3. 계란을 풀어 넣고 밥과 함께 볶는다.\n"
            "4. 소금과 후추로 간을 맞춘다."
        ),
        "cooking_time_min": 15,
        "description": "누구나 실패 없이 만드는 기본 계란볶음밥",
        "servings": 2,
        "difficulty": "easy",
        "tip": "찬밥을 쓰면 밥알이 서로 붙지 않고 고소하게 볶아집니다.",
        "ingredients": [("계란", "2개", False), ("양파", "1/2개", False), ("당근", "1/4개", True)],
    },
    {
        "title": "돼지고기 김치찌개",
        "instructions": (
            "1. 돼지고기를 한입 크기로 썰어 냄비에 기름 없이 볶는다.\n"
            "2. 신김치를 넣고 함께 볶아 김치의 신맛을 살린다.\n"
            "3. 물을 붓고 두부, 양파, 대파, 다진 마늘을 넣어 끓인다.\n"
            "4. 중약불에서 15분 정도 더 끓여 맛이 배게 한다."
        ),
        "cooking_time_min": 30,
        "description": "얼큰하고 진한 국물의 돼지고기 김치찌개",
        "servings": 3,
        "difficulty": "normal",
        "tip": "김치를 먼저 볶으면 국물이 훨씬 깊고 진해집니다.",
        "ingredients": [
            ("돼지고기", "200g", False),
            ("김치", "300g", False),
            ("두부", "1/2모", False),
            ("양파", "1/2개", True),
            ("대파", "1대", True),
            ("마늘", "1큰술", True),
        ],
    },
    {
        "title": "두부조림",
        "instructions": (
            "1. 두부를 도톰하게 썰어 팬에 노릇하게 굽는다.\n"
            "2. 간장, 다진 마늘, 대파, 물을 섞어 양념장을 만든다.\n"
            "3. 구운 두부 위에 양념장을 붓고 약불에서 조린다.\n"
            "4. 국물이 자작해질 때까지 졸인다."
        ),
        "cooking_time_min": 20,
        "description": "짭짤하고 담백한 밑반찬 두부조림",
        "servings": 2,
        "difficulty": "easy",
        "tip": "두부를 미리 구워두면 조려도 부서지지 않습니다.",
        "ingredients": [
            ("두부", "1모", False),
            ("대파", "1/2대", False),
            ("마늘", "1작은술", True),
            ("양파", "1/4개", True),
        ],
    },
    {
        "title": "감자당근볶음",
        "instructions": (
            "1. 감자와 당근을 채 썬다.\n"
            "2. 팬에 기름을 두르고 양파를 먼저 볶는다.\n"
            "3. 감자와 당근을 넣고 투명해질 때까지 볶는다.\n"
            "4. 소금과 후추로 간을 맞춘다."
        ),
        "cooking_time_min": 15,
        "description": "아삭한 식감이 좋은 감자당근볶음",
        "servings": 2,
        "difficulty": "easy",
        "tip": "감자를 물에 담가 전분기를 빼면 더 깔끔하게 볶아집니다.",
        "ingredients": [
            ("감자", "1개", False),
            ("당근", "1/2개", False),
            ("양파", "1/4개", True),
            ("마늘", "1작은술", True),
        ],
    },
    {
        "title": "애호박전",
        "instructions": (
            "1. 애호박을 도톰하게 원형으로 썬다.\n"
            "2. 소금을 살짝 뿌려 밑간한다.\n"
            "3. 애호박에 밀가루를 살짝 묻힌 뒤 계란물을 입힌다.\n"
            "4. 팬에 기름을 두르고 노릇하게 부친다."
        ),
        "cooking_time_min": 20,
        "description": "부드럽고 고소한 애호박전",
        "servings": 2,
        "difficulty": "easy",
        "tip": "애호박은 너무 얇게 썰면 부치는 중에 부서지기 쉽습니다.",
        "ingredients": [("애호박", "1개", False), ("계란", "1개", False), ("마늘", "1작은술", True)],
    },
    {
        "title": "돼지고기 김치볶음",
        "instructions": (
            "1. 돼지고기를 한입 크기로 썰어 밑간한다.\n"
            "2. 팬에 기름을 두르고 다진 마늘과 돼지고기를 볶는다.\n"
            "3. 신김치와 양파, 대파를 넣고 함께 볶는다.\n"
            "4. 김치가 부드러워질 때까지 중불에서 볶는다."
        ),
        "cooking_time_min": 20,
        "description": "밥반찬으로 좋은 매콤한 돼지고기 김치볶음",
        "servings": 3,
        "difficulty": "easy",
        "tip": "설탕을 한 꼬집 넣으면 김치의 신맛이 부드러워집니다.",
        "ingredients": [
            ("돼지고기", "200g", False),
            ("김치", "250g", False),
            ("양파", "1/2개", True),
            ("대파", "1/2대", True),
            ("마늘", "1큰술", True),
        ],
    },
    {
        "title": "감자조림",
        "instructions": (
            "1. 감자와 당근을 한입 크기로 썬다.\n"
            "2. 냄비에 간장, 물, 다진 마늘을 넣고 끓인다.\n"
            "3. 감자와 당근을 넣고 중약불에서 조린다.\n"
            "4. 대파를 넣고 국물이 졸아들 때까지 조린다."
        ),
        "cooking_time_min": 25,
        "description": "짭조름한 밑반찬 감자조림",
        "servings": 2,
        "difficulty": "easy",
        "tip": "감자를 각지게 썰면 양념이 더 잘 배어듭니다.",
        "ingredients": [
            ("감자", "2개", False),
            ("당근", "1/2개", True),
            ("대파", "1/2대", True),
            ("마늘", "1작은술", True),
        ],
    },
    {
        "title": "계란찜",
        "instructions": (
            "1. 계란을 잘 풀고 물을 섞는다.\n"
            "2. 다진 대파를 넣고 소금으로 간한다.\n"
            "3. 뚝배기에 부어 약불에서 저어가며 익힌다.\n"
            "4. 몽글몽글해지면 뚜껑을 덮어 뜸을 들인다."
        ),
        "cooking_time_min": 15,
        "description": "부드럽고 폭신한 계란찜",
        "servings": 2,
        "difficulty": "easy",
        "tip": "센 불에서 익히면 구멍이 숭숭 생기니 약불을 유지하세요.",
        "ingredients": [("계란", "3개", False), ("대파", "1/4대", True)],
    },
    {
        "title": "애호박볶음",
        "instructions": (
            "1. 애호박을 반달 모양으로 썬다.\n"
            "2. 팬에 기름을 두르고 다진 마늘과 양파를 볶는다.\n"
            "3. 애호박을 넣고 소금으로 간해 볶는다.\n"
            "4. 대파를 올려 마무리한다."
        ),
        "cooking_time_min": 12,
        "description": "짧은 시간에 완성하는 애호박볶음",
        "servings": 2,
        "difficulty": "easy",
        "tip": "애호박은 오래 볶으면 물러지니 센 불에서 빠르게 볶으세요.",
        "ingredients": [
            ("애호박", "1개", False),
            ("양파", "1/4개", True),
            ("마늘", "1작은술", True),
            ("대파", "1/4대", True),
        ],
    },
    {
        "title": "두부 김치 전골",
        "instructions": (
            "1. 냄비에 신김치와 돼지고기를 넣고 볶는다.\n"
            "2. 물을 붓고 끓으면 두부를 큼직하게 썰어 넣는다.\n"
            "3. 양파와 대파, 다진 마늘을 넣고 함께 끓인다.\n"
            "4. 중약불에서 10분 더 끓여 재료를 익힌다."
        ),
        "cooking_time_min": 25,
        "description": "푸짐하게 즐기는 두부 김치 전골",
        "servings": 3,
        "difficulty": "normal",
        "tip": "두부는 마지막에 넣어야 으깨지지 않고 모양이 살아있습니다.",
        "ingredients": [
            ("두부", "1모", False),
            ("김치", "200g", False),
            ("돼지고기", "150g", True),
            ("양파", "1/2개", True),
            ("대파", "1대", True),
            ("마늘", "1큰술", True),
        ],
    },
]


def seed_recipes(session: Session) -> list[Recipe]:
    """RECIPE_SEEDS의 레시피를 idempotent하게 시드한다 (제목 기준 존재 여부 확인)."""

    def _ingredient(name: str) -> Ingredient:
        normalized = normalize_ingredient_name(name)
        ingredient = session.exec(
            select(Ingredient).where(Ingredient.normalized_name == normalized)
        ).first()
        if ingredient is None:
            raise RuntimeError(f"'{name}' 재료가 없습니다. seed_top_ingredients를 먼저 실행하세요.")
        return ingredient

    seeded: list[Recipe] = []
    for spec in RECIPE_SEEDS:
        existing = session.exec(select(Recipe).where(Recipe.title == spec["title"])).first()
        if existing:
            seeded.append(existing)
            continue

        recipe = Recipe(
            title=spec["title"],
            source="manual",
            instructions=spec["instructions"],
            cooking_time_min=spec["cooking_time_min"],
            is_llm_generated=False,
            description=spec["description"],
            servings=spec["servings"],
            difficulty=spec["difficulty"],
            tip=spec["tip"],
        )
        session.add(recipe)
        session.flush()

        for name, quantity, is_optional in spec["ingredients"]:
            session.add(
                RecipeIngredient(
                    recipe_id=recipe.id,
                    ingredient_id=_ingredient(name).id,
                    quantity=quantity,
                    is_optional=is_optional,
                )
            )
        session.commit()
        seeded.append(recipe)

    return seeded
