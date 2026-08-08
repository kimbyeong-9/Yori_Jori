import uuid

from app.services.recommendation_hash import compute_ingredients_hash, compute_search_hash

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


def test_search_hash_is_order_independent():
    hash_1 = compute_search_hash(
        ["양파", "계란"], prompt_version="search_v1", model_name="m"
    )
    hash_2 = compute_search_hash(
        ["계란", "양파"], prompt_version="search_v1", model_name="m"
    )
    assert hash_1 == hash_2


def test_search_hash_differs_from_ingredients_hash_with_same_prompt_version():
    """이름 기반 검색 해시와 ID 기반 냉장고 해시는 서로 다른 함수라 값 공간이 겹치지 않는다."""
    search_hash = compute_search_hash(["양파"], prompt_version="v1", model_name="m")
    fridge_hash = compute_ingredients_hash(
        [(ID_A, "fresh")], locale="ko-KR", prompt_version="v1", model_name="m"
    )
    assert search_hash != fridge_hash
