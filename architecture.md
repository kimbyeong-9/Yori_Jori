# 아키텍처 개요 — 요리조리 (Yori Jori)

- 문서 버전: v0.4 — 5단계(프론트엔드 전체 구현)까지 반영
- 작성일: 2026-07-31 (최종 갱신 2026-08-02)
- 상태: 백엔드(세션·재료·냉장고·레시피·저장·이벤트·추천)와 프론트엔드(6개 페이지) 모두
  구현 완료. 남은 Open Decision은 [docs/decision-log.md](./docs/decision-log.md) 참조.

이 문서는 실제 구현된 구조를 기술한다. §2는 최초 제안 당시의 트리를 그대로 두되, §3/§4에서
각 레이어의 실제 구현(파일 경로, 확정된 설계 결정)을 설명한다.

## 1. 시스템 개요

```
[React SPA] --Axios--> [FastAPI] --SQLModel--> [PostgreSQL]
                            |
                            +--HTTPX AsyncClient--> [Gemini API (구조화 출력)]
```

- 프론트엔드는 세션 컨텍스트(Session Context)로 비로그인 세션을 식별해 API를 호출한다.
- 백엔드는 추천 요청 시점에 Gemini API를 호출해 구조화된 레시피 후보를 받고,
  Pydantic 스키마로 검증한 뒤 도메인 모델로 변환한다.
- Gemini 호출 실패/타임아웃 시에도 서비스 전체가 죽지 않도록 격리한다 (§5 참조).

## 2. 제안 리포지토리 구조

```
yori_jori/
├── CLAUDE.md
├── architecture.md
├── docs/
│   ├── product-requirements.md
│   ├── api-contract.md
│   ├── event-taxonomy.md
│   ├── decision-log.md
│   └── backlog.md
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/            # settings(Pydantic Settings), config, logging
│   │   ├── db/               # SQLModel engine/session, base
│   │   ├── models/           # SQLModel 테이블 정의
│   │   ├── schemas/          # Pydantic 요청/응답/Gemini 구조화 출력 스키마
│   │   ├── api/               # FastAPI 라우터 (도메인별)
│   │   ├── services/         # 도메인 로직 (fridge, recommendation, recipe, event)
│   │   ├── integrations/     # gemini_client 등 외부 연동 (HTTPX AsyncClient 래핑)
│   │   └── seed/              # pandas/openpyxl 기반 재료 마스터 시드
│   ├── alembic/               # 마이그레이션
│   ├── tests/                 # pytest
│   └── pyproject.toml
└── frontend/
    ├── src/
    │   ├── pages/              # HomePage, FridgePage, IngredientAddPage,
    │   │                       # RecipeListPage, RecipeDetailPage, SavedRecipesPage
    │   ├── components/
    │   ├── context/            # SessionContext
    │   ├── api/                # axios 인스턴스, 도메인별 API 클라이언트, 타입
    │   ├── router/             # React Router 설정
    │   └── analytics/          # 이벤트 발행 유틸 (event-taxonomy.md 기준)
    ├── tests/                  # Vitest + React Testing Library
    └── package.json
```

## 3. 백엔드 아키텍처

### 3.1 레이어링

3단계(기본 API)에서 Router → Service → Repository 3계층으로 확정했다 (`backend/app/api`,
`backend/app/services`, `backend/app/repositories`).

- `api/` (라우터): 요청/응답 스키마 검증, `session_id` 쿼리/바디 파싱, 서비스 계층 호출과
  응답 스키마 조립만 담당. **DB 세션이나 레포지토리를 직접 호출하지 않는다** — 이미
  service가 반환한 도메인 객체를 response schema로 매핑하는 것까지만 라우터의 몫이다.
- `services/`: 도메인 로직 — 존재/소유권 검증, 여러 레포지토리 조합, 트랜잭션 경계
  (`db.commit()` 호출 지점), 외부 API 호출과의 조합. `AppError` 계열 예외를 던져 실패를
  표현한다.
- `repositories/`: 테이블당 1파일, 순수 CRUD/쿼리 함수만 둔다(비즈니스 판단 없음). SQL/ORM
  쿼리는 이 계층에만 존재한다.
- `integrations/gemini_client`: Gemini API 호출 전용 (다음 단계에서 추가 예정). 타임아웃/
  재시도/에러 매핑을 이 계층에 집중
- `models/` (SQLModel): DB 테이블
- `schemas/`: API I/O 및 Gemini 구조화 출력 검증용 Pydantic 모델 (모델과 분리)
- `core/errors.py`: `AppError`/`NotFoundError`/`ForbiddenError`/`ConflictError`/
  `ValidationError`. `app/main.py`의 예외 핸들러가 이들과 FastAPI `RequestValidationError`를
  모두 `{"error": {"code", "message"}}` 형식으로 통일해 반환한다 (`docs/api-contract.md` §0).
- `core/event_types.py`: `docs/event-taxonomy.md`의 11개 이벤트 이름을 상수화해 이벤트 API가
  검증에 사용한다 (임의 이벤트명 추가/변경 방지, CLAUDE.md 규칙 7).

### 3.2 데이터 모델 (2단계에서 확정, `backend/app/models/`)

| 테이블 | 모델 클래스 | 설명 | 주요 필드 |
|---|---|---|---|
| `anonymous_users` | `AnonymousUser` | 비로그인 사용자 식별 단위 | id, browser_uuid(unique), user_agent, created_at, last_seen_at |
| `user_sessions` | `UserSession` | 세션(브라우저 방문 단위) | id, anonymous_user_id(FK), created_at, expires_at |
| `ingredients` | `Ingredient` | 재료 마스터 | id, name, normalized_name(unique), category, unit, is_top |
| `fridge_items` | `FridgeItem` | 세션이 등록한 냉장고 재료 | id, session_id(FK), ingredient_id(FK), quantity, input_method, freshness_status, food_expires_at, action_due_at, created_at, updated_at |
| `recipes` | `Recipe` | 레시피(생성 또는 수동 등록) | id, title, source, source_url, instructions, cooking_time_min, is_llm_generated, prompt_version, description, servings, difficulty, tip(DL-017, 전부 nullable) |
| `recipe_ingredients` | `RecipeIngredient` | 레시피-재료 관계 | recipe_id(FK), ingredient_id(FK), quantity, is_optional |
| `recommendation_requests` | `RecommendationRequest` | 추천 요청 이력 | id, session_id(FK), ingredients_hash, source |
| `recommendation_request_items` | `RecommendationRequestItem` | 요청 시점의 재료/신선도 스냅샷 | recommendation_request_id(FK), fridge_item_id(FK), freshness_status |
| `saved_recipes` | `SavedRecipe` | 저장된 레시피 | id, session_id(FK), recipe_id(FK), created_at — `(session_id, recipe_id)` unique |
| `interaction_logs` | `InteractionLog` | 이벤트 로그(자체 저장) | id, session_id(FK), recipe_id(nullable FK), event_type, metadata(JSONB), created_at |
| `llm_cache` | `LLMCache` | Gemini 응답 캐시 | id, ingredients_hash(unique), response_text, parsed_recipes(JSONB), hit_count, prompt_version, model_name |

- `freshness_status`는 `fresh` / `near_expiry` / `expired` 세 값(CHECK 제약)이며,
  `fridge_items.action_due_at`(서비스 행동 유도 기한, `food_expires_at`=실제 소비기한과는
  다른 개념)은 `app/services/freshness.compute_action_due_at`로 생성 시(created_at 기준)
  또는 PATCH로 신선도가 바뀔 때(지금 기준, DL-010 Decided) 자동 계산된다
  (fresh: +48h, near_expiry: +24h, expired: null).
- `interaction_logs`의 DB 컬럼명은 `metadata`이지만, SQLAlchemy/SQLModel이 클래스 속성명
  `metadata`를 예약해 Python 속성명은 `event_metadata`로 매핑한다. 같은 이유로
  `schemas/event.py`의 `EventCreate`도 Python 속성명 `event_metadata` + `alias="metadata"`를
  쓴다.
- 모델 클래스명 `UserSession`은 테이블명(`user_sessions`)과 다르게 지었다 —
  `sqlmodel.Session`(DB 세션 클래스)과의 이름 충돌을 피하기 위함.
- `recommendation_requests`/`recommendation_request_items`/`llm_cache`는 2단계에서 스키마만
  만들어졌고 4단계(`POST /recommendations`)에서 실제로 쓰이기 시작했다.
- 엔티티/관계는 [decision-log.md](./docs/decision-log.md) DL-004/DL-005/DL-008/DL-009/DL-010/
  DL-011에서 Decided로 확정되었다. DL-006(재료 마스터 실제 데이터 출처)·DL-007(재료 자유
  등록)·DL-012(추천 DB 매칭 임계값 튜닝)만 여전히 Open이다.

### 3.3 Gemini 연동 및 장애 격리 (CLAUDE.md 규칙 8, 9 — 4단계에서 구현)
- `integrations/gemini_client.py`가 HTTPX `AsyncClient`를 프로세스 전체에서 재사용하는
  싱글턴으로 관리한다(`get_http_client()`, 앱 종료 시 `close_http_client()` — `main.py`의
  `lifespan`에서 호출). 인증은 URL 쿼리가 아니라 `x-goog-api-key` 헤더로 보내 로그/URL에
  키가 남지 않게 한다.
- 타임아웃 `GEMINI_TIMEOUT_SECONDS`(기본 25초 — 레시피 최대 5개 구조화 출력이 10초를
  넘는 경우가 많아 상향, DL-009 참조), 실패 시 최대 1회 재시도(4xx는 재시도 안
  함). 최종 실패 시 `GeminiTimeoutError`/`GeminiRequestError`/`GeminiInvalidResponseError`
  중 하나를 던진다.
- 모든 Gemini 응답은 `schemas/gemini.py`의 `GeminiRecipeItem`(Pydantic)으로 파싱/검증한
  뒤에만 사용한다(CLAUDE.md 규칙 8). 검증 실패는 위 예외와 동일하게 취급.
- `services/recommendation_service.py`가 이 예외들을 잡아 DB 우선 매칭 결과로 폴백한다
  (없으면 빈 배열) — Gemini 실패가 `/recommendations` 응답을 500으로 만들지 않는다
  (CLAUDE.md 규칙 9). 다른 API(냉장고, 저장 등)는 Gemini와 무관하므로 영향 없음.
- 검증에 통과한 레시피만 `recipes`/`recipe_ingredients`에 upsert하고 `llm_cache`에
  저장한다 — 잘못된 응답은 캐시에 남지 않는다.
- 프롬프트는 코드에 직접 쓰지 않고 `app/prompts/recipe_recommendation_v2.txt`로 분리
  (`PROMPT_VERSION` 상수와 파일명을 짝지어 관리, `recommendation_service.py`). v1은 기록
  보존용으로 남겨두고 v2부터 `servings`/`difficulty`/`description`/`tip`도 함께 생성한다
  (DL-017). 버전이 바뀌면 `ingredients_hash`도 바뀌어 이전 버전 캐시와 자연히 분리된다.
- 구체 타임아웃/재시도/폴백 정책은 [decision-log.md](./docs/decision-log.md) DL-009
  (Decided). DB "충분함" 판단 임계값은 DL-012(Open, 임시 상수).
- **자유 재료명 검색(`POST /recipes/search`, DL-020, BL-13)**: 냉장고 재료(신선도 있음)
  흐름과 별개로, 재료명 문자열만으로 레시피를 찾는 경로다. 캐시 조회/Gemini 호출/경쟁
  상태 방어(DL-018)는 `_get_or_create_gemini_recipes`로 두 흐름이 공유하고, 프롬프트
  (`app/prompts/recipe_search_v1.txt`)와 캐시 네임스페이스(`SEARCH_PROMPT_VERSION =
  "search_v1"`, `compute_search_hash`)만 분리한다.
- **`call_gemini`의 구조화 출력 스키마는 호출부가 넘긴다(DL-007, BL-15)**: 원래
  `gemini_client.py`가 레시피 배열 응답 스키마를 모듈 내부에 고정해뒀는데, 재료 자유
  등록(`POST /ingredients`)의 단일 객체 검증 응답(`GeminiIngredientValidation`)에는 다른
  스키마가 필요해 `response_schema` 파라미터로 일반화했다. 레시피 스키마는
  `recommendation_service._RECIPE_RESPONSE_SCHEMA`로, 재료 검증 스키마는
  `ingredient_service._INGREDIENT_RESPONSE_SCHEMA`로 각 호출부에 있다. 재료 검증은
  레시피 추천과 달리 실패 시 DB 폴백이 없다 — Gemini 호출 자체가 실패하면
  `ExternalServiceError`(503)로 명확히 실패한다(재료 마스터 정확성을 가용성보다 우선).

### 3.4 설정/환경
- `Pydantic Settings`로 환경변수 로드 (DB URL, Gemini API Key 등)
- `.env`는 커밋하지 않음 (예시는 `.env.example`)

## 4. 프론트엔드 아키텍처 (5단계에서 구현, `frontend/src/`)

```
src/
├── main.tsx, App.tsx(라우팅), index.css(Tailwind 테마 토큰 + 폰트)
├── context/SessionContext.tsx      # browser_uuid/session_id 관리 (feature 아님, 전역)
├── layout/AppLayout.tsx            # NavBar + <Outlet/> + Footer (BL-13부터 NavBar/Footer 분리)
├── components/                     # Button, Card, Badge, Tabs, EmptyState, Spinner, ErrorState
├── lib/apiClient.ts                # axios 인스턴스 (baseURL '/api/v1')
├── types/common.ts                 # FreshnessStatus, 에러 메시지 추출 헬퍼
├── features/
│   ├── ingredient/    # api.ts, types.ts, useIngredientSearch, components/
│   ├── fridge/        # api.ts, types.ts, useFridgeItems, components/FridgeItemCard
│   ├── recommendation/# api.ts, types.ts, components/RecipeResultCard
│   ├── recipe/        # api.ts, types.ts, useRecentRecipes, components/(재료 목록, 조리 컨트롤)
│   ├── saved-recipes/ # api.ts, types.ts, components/SavedRecipeCard
│   └── analytics/     # eventTypes.ts(11개 이벤트 상수), track.ts
└── pages/HomePage, IngredientAddPage, FridgePage, RecipeListPage,
         RecipeDetailPage, SavedRecipesPage
```

- **라우팅**: React Router 7 (`BrowserRouter`)로 6개 페이지 매핑. 페이지는 `features/`의
  훅·컴포넌트를 조립만 하고 axios를 직접 호출하지 않는다.
- **세션(DL-003 구현)**: `SessionContext`가 `localStorage`의 `browser_uuid`(영구)와
  `session_id`(캐시)를 관리한다. 마운트 시 캐시된 `session_id`가 있으면 즉시 사용하고,
  백그라운드로 `POST /sessions`를 호출해 갱신한다. `localStorage`는 이 두 값 + UX 캐시
  용도로만 쓰고, 선택한 냉장고 재료 등은 저장하지 않는다(대신 `/recipes?fridge_item_ids=`
  쿼리스트링으로 전달 — 새로고침에도 안전, 전역 상태 불필요).
- **API 클라이언트**: `lib/apiClient.ts`(axios 인스턴스) + 각 feature의 `api.ts`. 타입은
  `docs/api-contract.md`의 필드명을 그대로 따른다 (CLAUDE.md 규칙 5).
- **CORS/프록시**: 백엔드에 CORS 미들웨어를 추가하지 않고, `vite.config.ts`의
  `server.proxy`가 `/api` → `http://localhost:8000`으로 프록시한다(브라우저 기준 동일
  출처). 프로덕션 배포는 Non-Goal이라 별도 리버스 프록시 설정은 이번 범위 밖.
- **분석 이벤트**: `features/analytics/track.ts`가 `docs/event-taxonomy.md`의 11개 이벤트
  이름을 상수화(`eventTypes.ts`)해 `POST /api/v1/events`로 보낸다. 전송 실패는 조용히
  무시해 사용자 흐름을 막지 않는다.
- **조리 시작/완료**: BL-09로 한 차례 구현했다가(DL-015) 2026-08-10에 기능 전체를
  제거했다(DL-022) — 화면에 타이머 등 사용자 가치가 없는 순수 분석 기록이라 불필요하다고
  판단. `recipe_start`/`recipe_complete` 이벤트 정의는 `event-taxonomy.md`에 남아있지만
  현재 이를 발생시키는 코드는 없다.
- **디자인 토큰**: `index.css`의 `@theme`에 색상(`brand-background/primary/secondary/
  accent/text`)만 커스텀 정의했다 — spacing(4,8,12,16,24,32,48)과 radius(8,12,16)는
  Tailwind 기본 스케일과 이미 일치해 그대로 사용한다. 폰트는 `font-family: 'Prompt',
  'Pretendard Variable', sans-serif` 한 줄로, 한글은 Prompt에 글리프가 없어 자동으로
  Pretendard로 폴백된다.

## 5. 테스트 전략

- 백엔드: pytest — 서비스 계층 단위 테스트, Gemini 클라이언트는 목(mock)으로 대체, API 계약 테스트
- 프론트엔드: Vitest + React Testing Library — 페이지/feature별 렌더·인터랙션 테스트.
  MSW 같은 네트워크 목 라이브러리는 쓰지 않고, 각 feature의 `api.ts` 모듈을
  `vi.mock`으로 대체한다(의존성 최소화). `SessionContext`도 `useSession`을 직접
  모킹해 실제 `POST /sessions` 호출 없이 페이지를 렌더링한다.
- 외부 API(Gemini) 실제 호출은 테스트에 포함하지 않는다

## 6. 비목표 (Non-Goals)

- 배포/인프라(호스팅, CI/CD) 구성 — 별도 백로그로 다룸
- 성능/부하 테스트
- `cook-sessions`(조리 시작/완료 전용 리소스) — BL-09로 구현했다가 2026-08-10 제거함(DL-022).
- 세션의 최근 검색/조회 재료 이력 조회(BL-16) — API 미설계, 등록만 해둔 상태.
