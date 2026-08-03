import uuid

from app.services.recommendation_hash import compute_ingredients_hash

ID_A = uuid.uuid4()
ID_B = uuid.uuid4()


def test_hash_is_order_independent():
    items_1 = [(ID_A, "fresh"), (ID_B, "near_expiry")]
    items_2 = [(ID_B, "near_expiry"), (ID_A, "fresh")]

    hash_1 = compute_ingredients_hash(
        items_1, locale="ko-KR", prompt_version="v1", model_name="gemini-2.0-flash"
    )
    hash_2 = compute_ingredients_hash(
        items_2, locale="ko-KR", prompt_version="v1", model_name="gemini-2.0-flash"
    )

    assert hash_1 == hash_2


def test_hash_changes_when_freshness_differs():
    base = compute_ingredients_hash(
        [(ID_A, "fresh")], locale="ko-KR", prompt_version="v1", model_name="m"
    )
    changed = compute_ingredients_hash(
        [(ID_A, "near_expiry")], locale="ko-KR", prompt_version="v1", model_name="m"
    )
    assert base != changed


def test_hash_changes_when_model_name_differs():
    base = compute_ingredients_hash(
        [(ID_A, "fresh")], locale="ko-KR", prompt_version="v1", model_name="model-a"
    )
    changed = compute_ingredients_hash(
        [(ID_A, "fresh")], locale="ko-KR", prompt_version="v1", model_name="model-b"
    )
    assert base != changed
