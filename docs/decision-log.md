# 의사결정 로그 (Decision Log)

이 문서는 ADR(Architecture Decision Record)의 경량 버전이다. 결정이 내려지면 상태를
`Decided`로 바꾸고 날짜/근거를 남긴다. 새로운 아키텍처/제품 결정이 생기면 항목을 추가한다.

형식: `DL-번호 | 날짜 | 상태 | 제목`

---

## DL-001 | 2026-07-31 | Decided | 문서화 단계에서는 코드/스캐폴딩을 생성하지 않는다
- **배경**: 0단계 지시사항에 따라 이번 단계는 문서만 작성한다.
- **결정**: `backend/`, `frontend/` 등 실제 코드 디렉터리는 생성하지 않고, `architecture.md`에
  제안 구조로만 기술한다.
- **영향**: 다음 백로그(스캐폴딩)에서 실제 구조와 문서를 다시 대조해 갱신해야 한다.

## DL-002 | 2026-07-31 | Decided | MVP는 비로그인 세션 기반으로 시작한다
- **배경**: 제품 목표에 로그인/계정 요구사항이 명시되어 있지 않다.
- **결정**: 세션 식별자(익명)로 냉장고/저장/조리 이력을 구분한다. 회원 시스템은 Out-of-Scope.
- **영향**: `product-requirements.md` §6, `api-contract.md` §0에 반영.
- **재검토 조건**: 다중 디바이스 동기화 요구가 생기면 재검토.

## DL-003 | 2026-07-31 | Decided | 세션 식별 방식 및 만료 정책
- **배경**: 비로그인 세션을 프론트-백엔드 간 어떻게 전달/유지할지 결정 필요.
- **결정 (2026-07-31, 3단계 기본 API 구현)**: 헤더/쿠키를 쓰지 않고, 클라이언트가
  `POST /api/v1/sessions` 응답의 `session_id`를 이후 요청에 쿼리 파라미터(`?session_id=`)
  또는 바디 필드로 직접 실어 보낸다. 기본 유효기간은 **30일**
  (`user_sessions.expires_at = created_at + 30일`). 같은 `browser_uuid`로 재호출하면 만료
  전 기존 세션을 재사용한다(매번 새로 만들지 않음) — 그래야 재방문/새로고침 시에도
  `fridge_items`/`saved_recipes` 접근이 끊기지 않는다.
  구현: `backend/app/services/session_service.get_or_create_session`,
  `POST /api/v1/sessions` ([api-contract.md](./api-contract.md) §1).
- **영향**: 세션 관리 관련 백로그(BL-01) 선행 차단 해제. 다른 세션 리소스 접근 시 응답
  코드는 DL-011 참조.
- **재검토 조건**: 실제 무중단 로그인 전환/다중 디바이스 동기화가 필요해지면 헤더/쿠키
  전환 및 만료기간 재검토.

## DL-004 | 2026-07-31 | Decided | 신선도(freshness) 값셋과 action_due_at 계산 규칙
- **배경**: `freshness_selected` 이벤트가 존재하므로 선택형 UI를 가정하지만 구체 값이 미정이었음.
- **결정 (2026-07-31, 2단계 DB 모델 작업 중 사용자 확인)**: `fresh` / `near_expiry` / `expired`
  세 값을 사용한다. `action_due_at`(서비스 행동 유도 기한)은 `fresh` → `created_at + 48시간`,
  `near_expiry` → `created_at + 24시간`, `expired` → `null`(이미 지난 재료는 기한 유도
  대상이 아님)으로 계산한다. 구현: `backend/app/services/freshness.compute_action_due_at`,
  `backend/app/models/fridge_item.py`(`FridgeItem.__init__`에서 자동 적용),
  `fridge_items` 테이블의 `ck_fridge_items_freshness_status` CHECK 제약.
- **영향**: `FridgeItem` 모델 필드 확정. IngredientAddPage/FridgePage UI 백로그(BL-04, BL-05)의
  선행 차단 해제.

## DL-005 | 2026-07-31 | Decided | 추천 레시피의 출처 및 영속화 정책
- **배경**: Gemini 실시간 생성 vs 사전 구축 레시피 DB vs 하이브리드에 따라 `Recipe` 테이블
  스키마와 저장/조리 플로우가 달라진다.
- **결정 (2026-07-31, 2단계 DB 모델 작업)**: 제안대로 확정. `recipes` 테이블에 `source`,
  `is_llm_generated`, `prompt_version` 필드를 두어 Gemini 생성 레시피와 수동/시드 레시피를
  같은 테이블에 영속화하고, 상세조회/저장/조리 시작은 항상 안정적인 `recipe_id`를 참조한다.
  Gemini 응답 원문/파싱 결과는 `llm_cache` 테이블(`ingredients_hash` 기준)에 별도 캐시한다.
- **영향**: `/recommendations`, `/recipes/{id}` 구현 백로그(BL-06, BL-07)의 선행 차단 해제.

## DL-006 | 2026-07-31 | Open | 재료 마스터 데이터 소스
- **배경**: pandas/openpyxl 스택이 지정되어 있어 Excel 기반 시드 데이터를 가정할 수 있으나
  원본 데이터 출처(직접 큐레이션 vs 외부 목록)가 미정.
- **필요 결정자**: 제품/데이터
- **차단 대상**: 재료 시드 백로그, `POST /api/v1/ingredients` 자유 등록 허용 여부(DL-007과 연관)
- **2026-07-31 갱신 (2단계 DB 모델)**: `backend/app/seed/seed_ingredients.py`에 Top 10 재료를
  코드 내 리스트(pandas DataFrame)로 임시 시드했다. 실제 소스(엑셀 파일 등)가 정해지면
  `pandas.read_excel(...)`로 교체하도록 경계를 분리해뒀다 — 이 결정 자체는 여전히 Open.

## DL-007 | 2026-07-31 | Open | 마스터에 없는 재료의 사용자 자유 등록 허용 여부
- **배경**: IngredientAddPage에서 검색 결과가 없을 때의 동작이 미정.
- **후보안**: (a) 자유 텍스트 등록 허용, (b) 마스터 목록 내에서만 선택 가능
- **차단 대상**: `POST /api/v1/ingredients` 구현 여부

## DL-008 | 2026-07-31 | Decided | 분석 이벤트 수집 방식
- **배경**: 자체 DB 저장만 사용할지, 외부 분석 도구(GA, Amplitude 등)를 병행할지 미정.
- **결정 (2026-07-31, 2단계 DB 모델)**: 제안대로 확정. MVP는 자체 `interaction_logs`
  테이블(세션 스코프, `event_type` + `metadata` JSONB)만 사용한다. 외부 도구 병행은 이번
  범위에 포함하지 않는다. 값 검증(허용된 event_type인지)은 이벤트 수집 API 백로그(BL-02)의
  몫으로 남긴다 — 이 테이블 자체는 값을 제한하지 않는다.
- **영향**: 이벤트 수집 백로그(BL-02)의 선행 차단 해제.

## DL-009 | 2026-07-31 | Decided | Gemini 실패 시 사용자 UX 및 재시도 정책 수치
- **배경**: CLAUDE.md 규칙 9(외부 API 실패가 전체 장애로 이어지지 않게 한다)에 따른 구체 정책
  (타임아웃 수치, 재시도 횟수, 사용자에게 보여줄 메시지/재시도 버튼 여부)이 미정.
- **결정 (2026-07-31, 4단계 추천/Gemini 연동)**: 타임아웃 10초(`GEMINI_TIMEOUT_SECONDS`
  설정 가능), 최대 1회 재시도(총 2회 시도, 4xx는 재시도 안 함). 실패(타임아웃/네트워크
  오류/5xx/잘못된 JSON·스키마)하면 예외를 사용자에게 보여주지 않고 **DB 추천 결과로
  자동 폴백**한다(기준 미달이라도 있는 그대로 반환, 없으면 빈 배열). 프론트에 "재시도"
  버튼 같은 별도 UX는 만들지 않음 — 폴백이 곧 사용자가 보는 결과다.
  구현: `backend/app/integrations/gemini_client.py`,
  `backend/app/services/recommendation_service.py`.
- **영향**: `/recommendations` 구현 백로그의 선행 차단 해제.

## DL-010 | 2026-07-31 | Decided | 신선도 변경 시 action_due_at 재계산 기준
- **배경**: DB 모델(`backend/app/models/fridge_item.py`)은 등록(생성) 시 `action_due_at`을
  `created_at` 기준으로 계산한다. FridgePage에서 나중에 `freshness_status`를 바꾸면
  (예: fresh → near_expiry) 이 값을 어느 시점 기준으로 다시 계산할지가 미정이었다.
- **결정 (2026-07-31, 3단계 기본 API 구현)**: `PATCH /api/v1/fridge-items/{id}`로
  `freshness_status`가 바뀌면 **변경 시점(지금)** 기준으로 재계산한다
  (`compute_action_due_at(new_status, now)`), 원래 `created_at` 기준을 유지하지 않는다.
  사용자가 방금 알려준 최신 상태를 기준으로 실제 행동을 유도하는 것이 더 유용하다고 판단.
  등록(POST) 시점 규칙(created_at 기준)은 그대로 유지.
  구현: `backend/app/services/fridge_service.update_fridge_item`.
- **영향**: `PATCH /api/v1/fridge-items/{id}` 백로그(BL-05) 선행 차단 해제.

## DL-011 | 2026-07-31 | Decided | 다른 세션 리소스 접근 시 응답 코드
- **배경**: 헤더/쿠키 없이 `session_id`를 쿼리·바디로 직접 주고받는 구조라, "존재하지 않는
  리소스"와 "다른 세션이 소유한 리소스"를 응답 코드로 구분할지 정해야 했다.
- **결정 (2026-07-31, 3단계 기본 API 구현)**: 존재하지 않는 리소스는 `404 Not Found`
  (`code: "not_found"`), 다른 세션이 소유한 리소스에 접근하면 `403 Forbidden`
  (`code: "forbidden"`)으로 명확히 구분한다. `saved_recipes`처럼 복합키(session_id,
  recipe_id)로만 조회되는 경우도 recipe_id 단독으로 다른 세션 소유 여부를 확인해 403/404를
  구분한다 (`saved_recipe_repo.get_any_by_recipe`).
- **영향**: `fridge-items`/`saved-recipes`의 PATCH/DELETE 전체에 적용.

## DL-012 | 2026-07-31 | Open | DB 매칭 "충분함" 임계값과 근접임박 가중치 수치
- **배경**: `POST /recommendations`가 DB 레시피만으로 응답을 끝낼지, Gemini까지 갈지
  결정하는 구체 수치가 지시사항에 없었다.
- **임시 결정 (2026-07-31, 4단계)**: 필수(비-optional) 재료 매칭률 0.5 이상인 레시피가
  3개 이상이면 DB만으로 반환(`MIN_DB_MATCH_RATIO`, `MIN_DB_RECIPE_COUNT`). 매칭된 재료 중
  `near_expiry` 1개당 `+0.15` 가중치(`NEAR_EXPIRY_BONUS`). 상수는
  `backend/app/services/recommendation_service.py`,
  `backend/app/services/recommendation_matching.py`에 모아뒀다.
- **상태**: 임시값 — 실사용 데이터/사용자 피드백으로 튜닝 필요. 지금은 레시피 DB가
  거의 비어 있어(시드 1건) 실질적으로 대부분 Gemini 경로를 타게 된다.
- **차단 대상**: 없음(임시값으로 진행 가능), 튜닝은 별도 백로그.

## DL-013 | 2026-08-02 | Decided | 조리 시작/완료는 전용 리소스 없이 이벤트로만 기록
- **배경**: `RecipeDetailPage`에 "이 레시피로 요리 시작"/"요리 완료" 버튼이 필요했는데,
  `cook-sessions` 백엔드 리소스는 아직 없다(BL-09 미착수, `docs/api-contract.md`에 명시).
- **결정 (2026-08-02, 5단계 프론트엔드 구현)**: `cook_session_id`는 프론트에서
  `crypto.randomUUID()`로 생성해 기존 `POST /api/v1/events`의 `recipe_start`/
  `recipe_complete` 이벤트 `metadata`에만 실어 보낸다. 새 백엔드 엔드포인트는 만들지
  않는다 — `event-taxonomy.md`가 이미 `cook_session_id`를 이 두 이벤트의 속성으로
  정의해뒀으므로 기존 계약을 벗어나지 않는다.
  구현: `frontend/src/features/recipe/components/CookModeControls.tsx`.
- **영향**: 실제 "조리 세션" 상태(시작~완료 사이 경과, 중도 이탈 등)는 서버에 별도
  레코드로 남지 않고 이벤트 로그로만 재구성 가능하다. BL-09를 나중에 구현하면 이
  프론트 로직을 실제 리소스 호출로 교체해야 한다.
- **2026-08-03 갱신**: DL-015에서 `cook_sessions` 리소스를 실제로 구현하면서 이 임시방편은
  대체됐다. 판단 근거(이벤트 재사용, 새 엔드포인트 안 만듦)는 기록으로 남겨두되, 현재
  코드는 이 방식을 쓰지 않는다.

## DL-015 | 2026-08-03 | Decided | `cook_sessions` 전용 리소스 구현 (BL-09)
- **배경**: DL-013으로 임시 처리했던 조리 시작/완료가 서버에 실제 레코드로 안 남아 "조리
  이력 조회"를 할 수 없었다. 제품/데이터 결정이 필요 없는 순수 기술 구현이라 사용자 승인
  절차 없이 바로 진행했다(사용자가 "스스로 할 수 있는 작업" 진행을 요청).
- **결정**: `cook_sessions` 테이블(id, session_id FK, recipe_id FK, started_at, completed_at
  nullable) 신설. `POST /api/v1/recipes/{recipe_id}/cook-sessions`(요청 `{session_id}`, 응답
  `{cook_session_id, started_at}`)로 시작, `PATCH /api/v1/cook-sessions/{id}/complete
  ?session_id=`(다른 PATCH/DELETE와 동일하게 쿼리 파라미터로 소유권 검증, DL-011 패턴)로
  완료. 이미 완료된 세션을 다시 완료 요청하면 기존 `completed_at`을 덮어쓰지 않고 그대로
  반환한다(idempotent).
  구현: `backend/app/models/cook_session.py`, `backend/app/repositories/cook_session_repo.py`,
  `backend/app/services/cook_session_service.py`, `backend/app/api/recipes.py`(시작),
  `backend/app/api/cook_sessions.py`(완료). 프론트는
  `frontend/src/features/recipe/components/CookModeControls.tsx`가 이 API를 호출한 뒤 같은
  `cook_session_id`로 `recipe_start`/`recipe_complete` 이벤트를 기록한다.
- **영향**: BL-09 완료. `docs/backlog.md` 갱신.

## DL-014 | 2026-08-02 | Decided(버그 수정) | 세션 생성 동시성 경쟁 처리
- **배경**: 5단계 브라우저 검증 중 `POST /api/v1/sessions`가 500을 낸 사례를 발견했다.
  React 19 StrictMode가 개발 모드에서 effect를 두 번 실행해, 같은(새로 생성된)
  `browser_uuid`로 거의 동시에 두 요청이 들어와 `anonymous_users.browser_uuid` unique
  제약을 두 요청이 동시에 위반한 것(둘 다 "없음"을 보고 INSERT 시도 → 경쟁).
- **결정 (2026-08-02)**: `session_service.get_or_create_session`에서 `IntegrityError`를
  잡아 롤백 후 같은 `browser_uuid`로 재조회해 이어간다(다른 요청이 이미 만든 행을
  재사용). 여러 탭을 동시에 열거나 새로고침을 연타하는 등 실제 운영에서도 발생 가능한
  경쟁이라 프론트 특이사항이 아니라 백엔드에서 근본 수정했다.
  구현: `backend/app/services/session_service.py`,
  회귀 테스트: `backend/tests/test_session_service_race.py`.
- **영향**: 없음(버그 수정, API 계약 변경 아님).

---

## 결정 요청 요약 (다음 대화에서 확인 필요)

| ID | 항목 | 상태 | 차단하는 백로그 |
|---|---|---|---|
| DL-006 | 재료 마스터 데이터의 실제 출처 | Open | 재료 시드 백로그(엑셀 교체) |
| DL-007 | 재료 자유 등록 허용 여부 | Open | 재료 등록 API(`POST /ingredients`) |
| DL-012 | DB 매칭 임계값·근접임박 가중치 튜닝 | Open | 없음(임시값으로 운영 가능) |
