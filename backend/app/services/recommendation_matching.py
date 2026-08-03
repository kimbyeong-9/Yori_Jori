import uuid
from dataclasses import dataclass

# 매칭된 재료 중 소비기한 임박(near_expiry)인 것 1개당 더해지는 가중치.
# 값이 크면 임박 재료를 쓰는 레시피가 더 강하게 우선된다. 튜닝 필요 (decision-log.md DL-012).
NEAR_EXPIRY_BONUS = 0.15


@dataclass(frozen=True)
class RecipeIngredientSpec:
    ingredient_id: uuid.UUID
    is_optional: bool


@dataclass(frozen=True)
class MatchResult:
    recipe_id: uuid.UUID
    match_ratio: float
    score: float
    matched_ingredient_ids: frozenset[uuid.UUID]
    missing_ingredient_ids: frozenset[uuid.UUID]


def score_recipe(
    recipe_id: uuid.UUID,
    recipe_ingredients: list[RecipeIngredientSpec],
    fridge_ingredient_ids: set[uuid.UUID],
    near_expiry_ingredient_ids: set[uuid.UUID],
) -> MatchResult:
    """레시피 하나에 대한 매칭 비율/가중치 점수를 계산한다 (DB 없이 순수 계산).

    match_ratio: 필수(비-optional) 재료 중 사용자가 가진 비율.
    score: match_ratio + (매칭된 재료 중 near_expiry인 것 수) * NEAR_EXPIRY_BONUS.
    """
    required_ids = {ri.ingredient_id for ri in recipe_ingredients if not ri.is_optional}
    if required_ids:
        match_ratio = len(required_ids & fridge_ingredient_ids) / len(required_ids)
    else:
        match_ratio = 0.0

    all_ids = {ri.ingredient_id for ri in recipe_ingredients}
    matched_ids = all_ids & fridge_ingredient_ids
    missing_ids = all_ids - fridge_ingredient_ids
    near_expiry_matched_count = len(matched_ids & near_expiry_ingredient_ids)

    score = match_ratio + near_expiry_matched_count * NEAR_EXPIRY_BONUS

    return MatchResult(
        recipe_id=recipe_id,
        match_ratio=match_ratio,
        score=score,
        matched_ingredient_ids=frozenset(matched_ids),
        missing_ingredient_ids=frozenset(missing_ids),
    )
