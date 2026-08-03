# docs/event-taxonomy.md에 정의된 이벤트 이름만 허용한다 (CLAUDE.md 규칙 7: 임의 변경 금지).
ALLOWED_EVENT_TYPES: frozenset[str] = frozenset(
    {
        "ingredient_search",
        "ingredient_added",
        "ingredient_selected",
        "freshness_selected",
        "recommend_request",
        "recommendation_impression",
        "recipe_click",
        "recipe_detail_view",
        "recipe_save",
        "recipe_start",
        "recipe_complete",
    }
)

# GET /api/v1/recipes/recent 가 "최근 본 레시피"로 취급하는 이벤트.
RECENT_RECIPE_VIEW_EVENT_TYPES: frozenset[str] = frozenset({"recipe_detail_view", "recipe_click"})
