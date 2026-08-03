# 이벤트 택소노미 (Event Taxonomy)

- 문서 버전: v0.1
- 작성일: 2026-07-31
- 규칙: 이 문서에 정의된 이벤트 이름은 임의로 변경하지 않는다 (CLAUDE.md 규칙 7).
  새 이벤트가 필요하면 이 문서를 먼저 갱신한 뒤 구현한다.

수집 방식은 자체 `interaction_logs` 테이블로 확정됐다 (DL-008, Decided).
전송 경로는 `POST /api/v1/events` ([api-contract.md](./api-contract.md) §6)이다.

## 공통 속성

모든 이벤트는 아래 공통 속성을 포함한다. (v0.1 초안 당시의 `event_name`/`properties`/
`occurred_at`은 실제 구현·DB 컬럼명에 맞춰 `event_type`/`metadata`로 정정했고,
`occurred_at`은 서버가 `created_at`으로 직접 기록하므로 클라이언트가 보내지 않는다.)

| 속성 | 설명 |
|---|---|
| `event_type` | 아래 표에 정의된 값 중 하나 (그 외 값은 API가 400으로 거부) |
| `session_id` | 익명 세션 식별자 |
| `recipe_id` | 레시피와 관련된 이벤트일 때만 (선택) |
| `metadata` | 이벤트별 추가 속성(아래 표의 "주요 속성", 자유 형식 JSON) |
| `created_at` | 서버가 기록하는 발생 시각 (클라이언트가 보내지 않음) |

## 이벤트 정의

| 이벤트명 | 발생 시점 | 발생 위치(페이지) | 주요 속성 | 대응 흐름 단계 |
|---|---|---|---|---|
| `ingredient_search` | 재료 자동완성 검색어 입력/조회 시 | `/ingredients/new` | `query` | 재료 등록 |
| `ingredient_added` | 재료를 냉장고에 추가 완료 시 | `/ingredients/new` | `ingredient_id`, `freshness` | 재료 등록 |
| `ingredient_selected` | 냉장고 목록에서 재료를 추천용으로 선택/해제 시 | `/fridge` | `ingredient_id`, `selected(boolean)` | 냉장고 재료 선택 |
| `freshness_selected` | 재료의 신선도 상태를 선택/변경 시 | `/fridge`, `/ingredients/new` | `ingredient_id`, `freshness` | 냉장고 재료 선택 |
| `recommend_request` | 선택된 재료로 추천을 요청할 시 | `/fridge` | `fridge_item_ids[]` | 추천 요청 |
| `recommendation_impression` | 추천 목록이 화면에 노출될 시 | `/recipes` | `request_id`, `recipe_ids[]` | 추천 목록 |
| `recipe_click` | 추천 목록에서 레시피 카드를 클릭할 시 | `/recipes` | `recipe_id`, `position` | 추천 목록 |
| `recipe_detail_view` | 레시피 상세 페이지 진입 시 | `/recipes/:id` | `recipe_id` | 레시피 상세 |
| `recipe_save` | 레시피 저장 액션 시 | `/recipes/:id` | `recipe_id` | 저장 또는 조리 시작 |
| `recipe_start` | 조리 시작 액션 시 | `/recipes/:id` | `recipe_id`, `cook_session_id` | 저장 또는 조리 시작 |
| `recipe_complete` | 조리 완료 액션 시 | `/recipes/:id` | `recipe_id`, `cook_session_id` | 조리 완료 |

## 퍼널 매핑 참고

```
ingredient_search / ingredient_added
        ↓
ingredient_selected / freshness_selected
        ↓
recommend_request
        ↓
recommendation_impression → recipe_click
        ↓
recipe_detail_view
        ↓
recipe_save   또는   recipe_start → recipe_complete
```

이 퍼널은 [product-requirements.md](./product-requirements.md) §3의 핵심 사용자 흐름과 동일하며,
전환율 분석 시 이 순서를 기준으로 삼는다.

## 확정 필요 항목

- `recipe_click`의 `position`(목록 내 순번) 계산 기준 — 현재는 `metadata.position`에
  프론트가 직접 계산해 넣는 것으로 가정, 서버 검증은 하지 않음

## 구현 참고 (5단계)

- `recipe_start`/`recipe_complete`의 `cook_session_id`는 백엔드에 `cook-sessions` 리소스가
  없어(BL-09 미착수) 프론트(`CookModeControls`)가 `crypto.randomUUID()`로 생성해
  `metadata.cook_session_id`로만 보낸다 (DL-013). 실제 "조리 세션" 레코드는 서버에 없고
  이벤트 로그로만 재구성 가능하다.
