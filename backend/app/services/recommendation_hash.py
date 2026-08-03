import hashlib
import json
import uuid
from collections.abc import Sequence

DEFAULT_LOCALE = "ko-KR"


def compute_ingredients_hash(
    items: Sequence[tuple[uuid.UUID, str]],
    *,
    locale: str,
    prompt_version: str,
    model_name: str,
) -> str:
    """(ingredient_id, freshness_status) 쌍 + locale/prompt_version/model_name을
    해싱한다. 입력 리스트의 순서와 무관하게 항상 같은 해시를 낸다(ingredient_id
    문자열 기준으로 정렬 후 직렬화).
    """
    sorted_items = sorted(items, key=lambda pair: str(pair[0]))
    payload = {
        "ingredients": [
            {"id": str(ingredient_id), "freshness": freshness}
            for ingredient_id, freshness in sorted_items
        ],
        "locale": locale,
        "prompt_version": prompt_version,
        "model_name": model_name,
    }
    serialized = json.dumps(payload, sort_keys=True, ensure_ascii=True, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()
