import uuid

from app.services.recommendation_matching import RecipeIngredientSpec, score_recipe

RECIPE_A = uuid.uuid4()
RECIPE_B = uuid.uuid4()
ING_1 = uuid.uuid4()
ING_2 = uuid.uuid4()


def test_near_expiry_ingredient_boosts_score_over_equal_match_ratio():
    specs = [
        RecipeIngredientSpec(ING_1, is_optional=False),
        RecipeIngredientSpec(ING_2, is_optional=False),
    ]
    fridge_ids = {ING_1, ING_2}

    result_without_near_expiry = score_recipe(
        RECIPE_A, specs, fridge_ids, near_expiry_ingredient_ids=set()
    )
    result_with_near_expiry = score_recipe(
        RECIPE_B, specs, fridge_ids, near_expiry_ingredient_ids={ING_1}
    )

    assert result_without_near_expiry.match_ratio == result_with_near_expiry.match_ratio == 1.0
    assert result_with_near_expiry.score > result_without_near_expiry.score


def test_match_ratio_only_counts_required_ingredients():
    specs = [
        RecipeIngredientSpec(ING_1, is_optional=False),
        RecipeIngredientSpec(ING_2, is_optional=True),
    ]
    # 필수(ING_1)만 있고 optional(ING_2)은 없어도 match_ratio는 1.0
    result = score_recipe(RECIPE_A, specs, {ING_1}, near_expiry_ingredient_ids=set())
    assert result.match_ratio == 1.0
    assert ING_2 in result.missing_ingredient_ids


def test_no_matching_ingredients_gives_zero_ratio():
    specs = [RecipeIngredientSpec(ING_1, is_optional=False)]
    result = score_recipe(RECIPE_A, specs, set(), near_expiry_ingredient_ids=set())
    assert result.match_ratio == 0.0
    assert result.score == 0.0
