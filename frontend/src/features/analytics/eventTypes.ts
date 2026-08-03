// docs/event-taxonomy.md에 정의된 11개 이벤트 이름. 임의로 바꾸지 않는다 (CLAUDE.md 규칙 7).
export const EVENT_TYPES = [
  'ingredient_search',
  'ingredient_added',
  'ingredient_selected',
  'freshness_selected',
  'recommend_request',
  'recommendation_impression',
  'recipe_click',
  'recipe_detail_view',
  'recipe_save',
  'recipe_start',
  'recipe_complete',
] as const

export type EventType = (typeof EVENT_TYPES)[number]
