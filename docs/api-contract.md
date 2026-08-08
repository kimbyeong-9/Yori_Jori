# API 계약 (API Contract)

- 문서 버전: v0.7 — §9 `POST /recipes/search`(자유 재료명 검색) 추가(DL-020, BL-13)
- 작성일: 2026-08-07 (최초 작성 2026-07-31)
- 상태: 세션·재료·냉장고·레시피 조회·저장·이벤트·추천·조리 시작/완료까지 구현 완료.
- 구현 위치: `backend/app/api/*.py` (라우터), `backend/app/services/*.py`, `backend/app/repositories/*.py`
- **API를 변경할 때는 이 문서와 프론트엔드 타입을 함께 수정한다 (CLAUDE.md 규칙 5).**

## 0. 공통 규약

- Base path: `/api/v1`
- **세션 전달 방식(DL-003 확정)**: 헤더/쿠키를 쓰지 않는다. 클라이언트가 `POST /sessions`로
  받은 `session_id`를 이후 요청에 쿼리 파라미터(`?session_id=`) 또는 요청 바디 필드로 직접
  실어 보낸다. 세션 소유가 아닌 리소스 접근은 `403 Forbidden`, 존재하지 않는 리소스는
  `404 Not Found`로 구분한다.
- 응답 포맷(성공): 리소스 JSON 직접 반환(단건) 또는 배열(목록). 봉투(envelope) 없음.
- 응답 포맷(에러) — `AppError`/`RequestValidationError` 공통 핸들러(`app/main.py`)가 통일:
  ```json
  { "error": { "code": "string", "message": "string" } }
  ```
  주요 `code` 값: `not_found`(404), `forbidden`(403), `conflict`(409),
  `invalid_request`(400), `validation_error`(422, 요청 스키마 자체가 잘못된 경우)
- Swagger UI: 서버 기동 후 `/docs` (OpenAPI 스키마는 `/openapi.json`)

## 1. Sessions (`/sessions`)

### `POST /api/v1/sessions`
- 용도: 비로그인 세션 발급/재사용
- 요청: `{ browser_uuid: UUID, user_agent?: string }`
- 동작: `browser_uuid`로 익명 사용자를 찾거나 새로 만든다(찾으면 `last_seen_at` 갱신). 그
  사용자의 만료되지 않은 세션이 있으면 **그 세션을 재사용**하고, 없으면 30일 유효기간의
  새 세션을 만든다. (같은 브라우저가 재방문해도 `fridge_items`/`saved_recipes` 접근이
  끊기지 않도록 하기 위함 — `docs/decision-log.md` DL-003 참조.)
- 응답 `200`: `{ session_id, anonymous_user_id, created_at, expires_at }`

## 2. Ingredients (`/ingredients`)

### `GET /api/v1/ingredients`
- 쿼리 파라미터(모두 선택, AND로 결합): `query`(이름 부분일치), `category`(정확히 일치),
  `top`(`true`면 Top10 재료만)
- 응답 `200`: `IngredientRead[]` — `{ id, name, category, unit, is_top }`

마스터에 없는 재료의 자유 등록(`POST /ingredients`)은 이번 범위에 없다 (DL-007 Open).

## 3. Fridge Items (`/fridge-items`)

### `GET /api/v1/fridge-items?session_id=`
- 응답 `200`: `FridgeItemRead[]` (최신 등록순) —
  `{ id, ingredient: IngredientRead, quantity, input_method, freshness_status, food_expires_at, action_due_at, created_at, updated_at }`
- 오류: 세션 없음 → `404`
- **자동 삭제(DL-016, 2026-08-06 확정)**: 조회 시점에 그 세션의 `action_due_at`이 지난
  항목을 먼저 삭제하고 나머지만 응답에 담는다(lazy cleanup, 별도 스케줄러 없음). `expired`
  상태처럼 `action_due_at`이 `null`인 항목은 이 자동 삭제 대상이 아니다.

### `POST /api/v1/fridge-items`
- 요청: `{ session_id, ingredient_id, quantity?, input_method, freshness_status, food_expires_at? }`
- `freshness_status`: `fresh` | `near_expiry` | `expired`
- `action_due_at` 자동 계산(등록 시, `created_at` 기준): `fresh`→+48h, `near_expiry`→+24h,
  `expired`→`null`. `food_expires_at`(실제 소비기한)은 별도로 그대로 저장된다.
- 응답 `201`: `FridgeItemRead`
- 오류: 세션/재료 없음 → `404`

### `PATCH /api/v1/fridge-items/{fridge_item_id}?session_id=`
- 요청(부분 수정, 보낸 필드만 반영): `{ quantity?, freshness_status?, food_expires_at? }`
- `freshness_status`를 바꾸면 `action_due_at`을 **지금 시점 기준**으로 다시 계산한다
  (등록 시의 `created_at` 기준 규칙과 다름 — DL-010 확정, 2026-07-31).
- 응답 `200`: `FridgeItemRead`
- 오류: 없는 id → `404` / 다른 세션 소유 → `403`

### `DELETE /api/v1/fridge-items/{fridge_item_id}?session_id=`
- 응답 `204`
- 오류: 없는 id → `404` / 다른 세션 소유 → `403`

## 4. Recipes (`/recipes`)

### `GET /api/v1/recipes/recent?session_id=`
- 해당 세션의 `recipe_detail_view` 또는 `recipe_click` 이벤트 로그를 기준으로, 레시피별
  가장 최근 조회 시각 순으로(레시피당 1건, 중복 제거) 반환한다.
- 응답 `200`: `RecipeSummary[]` — `{ id, title, cooking_time_min }`

### `GET /api/v1/recipes/{recipe_id}`
- 응답 `200`: `RecipeRead` —
  `{ id, title, source, source_url, instructions, cooking_time_min, is_llm_generated, created_at, description, servings, difficulty, tip, ingredients }`
  - `ingredients`: `{ ingredient: IngredientRead, quantity, is_optional }[]` (5단계 추가 —
    프론트 RecipeDetailPage가 "필요한 재료"/"보유·부족 재료"를 현재 세션의
    `GET /fridge-items` 결과와 대조해 계산할 수 있도록 재료 마스터 정보까지 함께 내려준다)
  - `description`(한 줄 소개), `servings`(인분 수), `difficulty`(`"easy"|"normal"|"hard"`),
    `tip`(조리 팁) — 전부 nullable(DL-017). Gemini가 생성하는 레시피는 항상 값을 채우고,
    과거 시드/캐시로 만들어진 레시피는 `null`일 수 있다.
- 오류: 없는 id → `404`

조리 시작/완료는 §7 참조. `POST /recommendations`로 생성되는 Gemini 레시피도 이
`/recipes/{id}`로 그대로 조회된다(§8 참조, `recipes` 테이블에 영속화되므로).

## 5. Saved Recipes (`/saved-recipes`)

### `GET /api/v1/saved-recipes?session_id=`
- 응답 `200`: `SavedRecipeListItem[]` — `{ id, recipe: RecipeSummary, created_at }` (최근 저장순)
- 오류: 세션 없음 → `404`

### `POST /api/v1/saved-recipes`
- 요청: `{ session_id, recipe_id }`
- 응답 `201`: `SavedRecipeRead` — `{ id, recipe_id, created_at }`
- 오류: 세션/레시피 없음 → `404` / 이미 저장됨(동일 session_id+recipe_id) → `409`

### `DELETE /api/v1/saved-recipes/{recipe_id}?session_id=`
- 응답 `204`
- 오류: 아무도 저장 안 함 → `404` / 다른 세션이 저장함 → `403`

## 6. Events (`/events`)

### `POST /api/v1/events`
- 요청: `{ session_id, event_type, recipe_id?, metadata? }`
- `event_type`은 [event-taxonomy.md](./event-taxonomy.md)에 정의된 11개 값만 허용 (그 외 값은
  `400 invalid_request`)
- `metadata`는 이벤트별 추가 속성을 담는 자유 형식 JSON 객체(예: `{ "query": "..." }`,
  `{ "position": 1 }`). DB 컬럼명도 `metadata`이다.
- 서버가 `created_at`을 기록하므로 클라이언트가 발생 시각을 보내지 않는다(과거 초안의
  `occurred_at` 필드는 제거).
- 응답 `202`(본문 없음)
- 오류: 허용되지 않은 `event_type` → `400` / 세션·(있다면) 레시피 없음 → `404`

## 7. Cook Sessions (`/recipes/{id}/cook-sessions`, `/cook-sessions`)

BL-09. `cook_session_id`는 `recipe_start`/`recipe_complete` 이벤트의 `metadata`에 실어
보내는 값과 동일해야 한다.

### `POST /api/v1/recipes/{recipe_id}/cook-sessions`
- 용도: 조리 시작
- 요청: `{ session_id }`
- 응답 `201`: `{ cook_session_id, started_at }`
- 오류: 세션/레시피 없음 → `404`

### `PATCH /api/v1/cook-sessions/{cook_session_id}/complete?session_id=`
- 용도: 조리 완료. 이미 완료된 세션에 다시 호출하면 기존 `completed_at`을 그대로
  반환한다(idempotent, 덮어쓰지 않음).
- 응답 `200`: `{ completed_at }`
- 오류: 없는 id → `404` / 다른 세션 소유 → `403`

## 8. Recommendations (`/recommendations`)

### `POST /api/v1/recommendations`
- 요청: `{ session_id, fridge_item_ids: UUID[] }`
- 응답 `200`:
  ```json
  {
    "recommendation_id": "uuid",
    "source": "db" | "gemini",
    "cached": false,
    "recipes": [
      {
        "id": "uuid",
        "title": "string",
        "cooking_time_min": 0,
        "instructions": "string",
        "matched_ingredients": ["string"],
        "missing_ingredients": ["string"],
        "safety_note": "string | null",
        "match_score": 0.0,
        "description": "string | null",
        "servings": "int | null",
        "difficulty": "easy | normal | hard | null",
        "tip": "string | null"
      }
    ]
  }
  ```
- 처리 순서: (1) `fridge_item_ids` 소유 세션 검증 → (2) 각 재료의 `ingredient_id`/
  `freshness_status`로 `ingredients_hash`(SHA-256) 계산 → (3) DB `recipes`를 먼저 매칭
  (재료 겹침 비율 + `near_expiry` 재료 가중치) → (4) **필수 재료 매칭률 50% 이상인 레시피가
  3개 이상**이면 `source="db"`로 즉시 반환 → (5) 부족하면 `llm_cache`를 해시로 조회
  (hit 시 `source="gemini", cached=true`) → (6) 캐시 없으면 Gemini 호출(최대 1회 재시도) →
  (7) 응답을 Pydantic으로 검증해 통과한 것만 `recipes`/`recipe_ingredients`에 저장하고
  `llm_cache`에도 저장(`cached=false`) → (8) Gemini 타임아웃/오류/검증 실패 시 **캐시에
  쓰지 않고** (4)의 DB 결과(기준 미달이라도)로 폴백 — 이 엔드포인트는 외부 API 실패로
  500이 되지 않는다. 매 호출마다 `recommendation_requests`+`recommendation_request_items`에
  요청 스냅숏을 남긴다.
- DB 매칭 임계값(50%, 3개), 근접임박 가중치(+0.15/개)는 임시 상수다
  ([decision-log.md](./decision-log.md) DL-012, 튜닝 필요).
- Gemini로 생성된 레시피는 `recipes.source="gemini"`, `is_llm_generated=true`로 저장되고
  이후 `GET /recipes/{id}`, 저장, 조리 시작 흐름에서 DB 레시피와 동일하게 취급된다.
- 프롬프트 v2(DL-017)부터 Gemini가 `servings`/`difficulty`/`description`/`tip`까지 함께
  생성한다. 버전이 바뀌어 `ingredients_hash`도 달라지므로, v1으로 캐시된 과거 `llm_cache`
  응답(이 필드들이 없음)과 자연히 분리된다.
- 오류: `fridge_item_ids` 중 존재하지 않는 게 있으면 `404` / 다른 세션 소유가 섞여 있으면
  `403`.

## 9. 자유 재료명 검색 (`/recipes/search`, DL-020, BL-13)

### `POST /api/v1/recipes/search`
- 용도: 냉장고 등록 없이 홈페이지에서 재료명만 입력해 바로 레시피를 찾는다.
- 요청: `{ session_id, ingredient_names: string[] }`
- 응답 `200`: `POST /recommendations`와 완전히 동일한 `RecommendationResponse` 모양
  (§8 참조). 신선도/임박 개념이 없어 근접임박 가중치는 항상 0이다.
- 처리 순서는 §8과 같다(DB 매칭 → 부족하면 캐시/Gemini 폴백) — 다만: (1) 재료명 문자열을
  마스터 `ingredients`에 최대한 매핑해 DB 매칭에 쓰고, 매핑 안 되는 이름은 DB 매칭에서만
  제외한다(Gemini 프롬프트에는 원문 그대로 들어간다), (2) 프롬프트/캐시 네임스페이스가
  `recommendations`(현재 `v2`)와 분리된 `search_v1`이라 두 흐름의 `llm_cache` 응답이 섞이지
  않는다, (3) `fridge_item_id`가 없어 `recommendation_request_items` 스냅숏은 남기지 않고
  `recommendation_requests`(source만)만 기록한다.
- 오류: 이 엔드포인트는 소유권 검증이 필요한 리소스를 참조하지 않아 404/403 오류 경로가
  없다.

## 10. 여전히 확정 필요한 항목

- `POST /api/v1/ingredients` 자유 등록 허용 여부 (DL-007)
- 재료 마스터 데이터의 실제 출처 (DL-006)
- DB 매칭 임계값·근접임박 가중치의 실사용 데이터 기반 튜닝 (DL-012)
- 페이지네이션 필요 여부 (`/saved-recipes`, `/fridge-items` 목록이 커질 경우)
