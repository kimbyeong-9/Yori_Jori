def normalize_ingredient_name(name: str) -> str:
    """재료명을 마스터 조회용 키로 정규화한다 (ingredients.normalized_name과 동일 규칙).

    시드 스크립트와 추천 매칭(Gemini 응답의 재료명 → 마스터 ingredient_id 조회)이
    같은 규칙을 공유해야 하므로 여기 한 곳에 둔다.
    """
    return name.strip().lower()
