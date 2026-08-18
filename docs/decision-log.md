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

## DL-007 | 2026-07-31 | Decided (2026-08-10) | 마스터에 없는 재료의 사용자 자유 등록 허용 여부
- **배경**: IngredientAddPage에서 검색 결과가 없을 때의 동작이 미정.
- **후보안**: (a) 자유 텍스트 등록 허용, (b) 마스터 목록 내에서만 선택 가능
- **결정 (2026-08-10)**: (a) 자유 텍스트 등록을 허용한다. 사용자가 다른 프로젝트용으로
  작성된 것처럼 보이는 FridgePage 참고 코드(로컬스토리지 냉장고 상태, `POST
  /ingredients`로 이름+카테고리 자유 생성, "식용 식재료로 인식되지 않습니다" 422 검증,
  `GET /sessions/:id/ingredients` 세션 재료 불러오기 등)를 제시하며 FridgePage 개편을
  요청했다. 참고 코드가 이번 아키텍처와 맞지 않는 부분(로컬스토리지, 세션 재료 불러오기
  API 부재 등)은 확인 질문을 거쳤고, 자유 등록은 사용자가 명시적으로 "확정"을 선택했다.
  세션 재료 불러오기는 이번 범위에서 제외하고 별도 백로그(BL-16)로만 등록한다.
  1. **카테고리/단위는 사용자 입력이 아니다**: 참고 코드는 카테고리 버튼 선택 UI를 뒀지만,
     실제 카테고리 taxonomy가 아직 4개(채소/축산물/가공식품/육류)뿐이고 출처가 미정이라
     (DL-006 Open) 사용자가 임의 카테고리를 만들게 하면 taxonomy가 파편화된다. 대신
     `POST /api/v1/ingredients`는 `{ name }`만 받고, category/unit은 서버가 Gemini로
     정한다 — 프롬프트에 현재 DB의 distinct category 목록을 넣어 그 안에서만 고르게
     한다(`ingredient_repo.list_categories`).
  2. **식용 검증**: `app/prompts/ingredient_validation_v1.txt` + `GeminiIngredientValidation`
     Pydantic 스키마(`is_edible`, `category`, `unit`, `reason`, CLAUDE.md 규칙 8)로 Gemini
     구조화 출력을 검증한다. `is_edible: false`면 `400 invalid_request`.
  3. **Gemini 장애 시 fail-closed**: `/recommendations`(DL-009)는 Gemini 실패 시 DB 결과로
     폴백하지만, 이 엔드포인트는 폴백할 안전한 기본값이 없다(재료 마스터에 잘못된 데이터가
     영구히 남는 게 가용성보다 나쁘다고 판단). Gemini 호출 자체가 실패하면(타임아웃/네트워크
     오류/응답 파싱 실패) 검증 없이 만들지 않고 새 에러 클래스
     `ExternalServiceError`(503, `external_service_unavailable`)를 던진다(CLAUDE.md 규칙
     9는 "전체 서비스 장애로 이어지지 않게"이지 "이 기능 자체가 항상 성공해야 함"은
     아니므로, 다른 API는 영향받지 않는다는 원칙은 유지된다).
  4. **`call_gemini` 일반화**: 기존 `integrations/gemini_client.call_gemini`가 레시피 배열
     응답 스키마를 모듈 내부에 하드코딩하고 있어 재료 검증(단일 객체 스키마)에 재사용할 수
     없었다. `response_schema` 파라미터로 일반화하고, 레시피 스키마는
     `recommendation_service._RECIPE_RESPONSE_SCHEMA`로 호출부에 옮겼다.
  5. **중복 등록 처리**: 이름 정규화(`normalize_ingredient_name`) 후 이미 있으면 새로
     만들지 않고 기존 재료를 `200`으로 반환한다(멱등). 동시 요청 경쟁 상태는
     `IntegrityError` 롤백 후 재조회하는 기존 패턴(DL-014/DL-018)을 그대로 따른다.
- **영향**: `POST /api/v1/ingredients` 구현(`docs/api-contract.md` §2). `architecture.md`
  §6 비목표에서 이 항목 제거. 프론트 `frontend/src/features/ingredient/api.ts`에
  `createIngredient(name)` 추가(FridgePage UI에서의 실제 연결은 다음 라운드 — BL-14).

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
- **결정 (2026-07-31, 4단계 추천/Gemini 연동)**: 타임아웃(`GEMINI_TIMEOUT_SECONDS`
  설정 가능), 최대 1회 재시도(총 2회 시도, 4xx는 재시도 안 함). 실패(타임아웃/네트워크
  오류/5xx/잘못된 JSON·스키마)하면 예외를 사용자에게 보여주지 않고 **DB 추천 결과로
  자동 폴백**한다(기준 미달이라도 있는 그대로 반환, 없으면 빈 배열). 프론트에 "재시도"
  버튼 같은 별도 UX는 만들지 않음 — 폴백이 곧 사용자가 보는 결과다.
  구현: `backend/app/integrations/gemini_client.py`,
  `backend/app/services/recommendation_service.py`.
- **2026-08-06 갱신**: 실제 키로 처음 검증하면서 기본 타임아웃 10초가 레시피 최대 5개
  구조화 출력(실측 약 10~11초)엔 항상 시간 초과가 나는 값이었다는 걸 발견 — 조용히
  DB로 폴백돼서 겉으로는 정상 응답처럼 보여 한동안 못 알아챘다. 기본값을 **25초**로
  올렸다(재시도 1회까지 최악의 경우 약 50초 대기). 진단 과정에서 모델명
  `gemini-2.0-flash`도 신규 키에서 무료 티어 할당량이 0으로 막혀 있어
  `gemini-flash-latest`로 기본값을 바꿨다(DL-006/DL-007과는 무관, 순수 API 계정
  설정 이슈).
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

## DL-016 | 2026-08-06 | Decided | 냉장고 재료 기한 자동 삭제 + 임박 3시간 카운트다운
- **배경**: `action_due_at`(신선도 기준 자동 계산 기한)이 계산은 되지만 이를 쓰는
  스케줄러/cron이 없고 UI에도 노출되지 않는다는 걸 사용자가 질문하며 확인, 이어서
  "기한이 지나면 자동 삭제 + 임박 3시간 전부터 재료별 N시간 남음 표시"를 요청했다.
- **결정**:
  1. **기준 필드**: `action_due_at`(사용자가 입력하는 날짜 단위 `food_expires_at`이 아님).
     모든 fresh/near_expiry 재료에 자동으로 채워지는 timestamp라 시간 단위 카운트다운에
     맞고, "재료별로 계산"이라는 요청과 일치한다. `expired` 상태(action_due_at 없음)는
     이번 자동삭제/카운트다운 대상에서 제외 — 이미 사용자가 수동으로 표시한 상태라
     기존 수동 삭제로 충분하다고 판단.
  2. **자동 삭제 방식**: APScheduler 등 새 스케줄러/인프라를 들이지 않고, `GET
     /fridge-items` 조회 시점에 그 세션의 만료 항목을 먼저 지우는 lazy cleanup을 쓴다
     (`backend/app/repositories/fridge_item_repo.py`의 `delete_expired`,
     `backend/app/services/fridge_service.py`의 `list_fridge_items`에서 호출). 프론트가
     60초 간격으로 목록을 다시 불러와(`useFridgeItems.ts`) 페이지를 열어둔 채로도 자연히
     사라지게 한다. 아무도 접속하지 않으면 다음 접속까지 DB에 남는다는 한계가 있으나,
     배포/상시 서버 인프라가 Non-Goal(architecture.md)인 이 프로젝트 규모에는 충분하다고
     판단.
  3. **카운트다운 표시**: 남은 시간이 3시간 이하일 때만 "N시간 남음"(올림, 최소 1)을
     표시한다(`frontend/src/features/fridge/countdown.ts`의 `getExpiryCountdownLabel`).
     `FridgeItemCard.tsx`가 30초마다 재계산해 기존 신선도 배지 옆에 강조 배지로 보여준다.
- **영향**: `GET /fridge-items` 응답에서 만료 항목이 자동으로 빠짐(`docs/api-contract.md`
  갱신). 새 백엔드 의존성 없음.

## DL-017 | 2026-08-06 | Decided | 레시피 인분/난이도/한줄소개/팁 — 백엔드 확장 + Gemini 생성
- **배경**: 레시피 상세 페이지(RecipeDetailPage) UI를 스크린샷 기준으로 다시 만들면서
  인분 수·난이도·한 줄 소개·셰프의 팁이 필요했는데 `recipes` 테이블에 해당 데이터가 전혀
  없었다. UI만 임시 고정값으로 채울지, 실제로 백엔드/Gemini까지 확장할지 사용자에게
  물었고 **"백엔드까지 확장하고 LLM이 조사해서 작성 후 제공"** 하는 쪽으로 확정했다.
- **결정**:
  1. `recipes`에 `description`(한 줄 소개), `servings`(인분 수),
     `difficulty`(`RecipeDifficulty`: easy/normal/hard, CHECK 제약), `tip`(조리 팁) 4개
     컬럼을 전부 nullable로 추가(과거 시드/캐시 레시피와 호환). 구현:
     `backend/app/models/enums.py`, `backend/app/models/recipe.py`, 마이그레이션
     `d2814e88228e`.
  2. Gemini 프롬프트를 v1→v2로 올려(`backend/app/prompts/recipe_recommendation_v2.txt`,
     `PROMPT_VERSION="v2"`) 이 4개 필드를 함께 생성하도록 지시하고,
     `GeminiRecipeItem`/`_RESPONSE_SCHEMA`에 `Literal["easy","normal","hard"]` 검증을
     추가했다(CLAUDE.md 규칙 8). 프롬프트 버전이 바뀌면 `ingredients_hash`도 달라져 v1
     캐시(이 필드 없음)와 자연히 분리되므로 별도 캐시 마이그레이션/무효화 로직은 필요
     없었다.
  3. "안전 유의사항" UI 박스는 추천 전용 `safety_note`(레시피별 구체적 주의사항, DB에
     영속화되지 않음)를 새로 끌어오지 않고, `is_llm_generated`가 true일 때 항상 뜨는
     고정 disclaimer 문구로 처리한다 — 스크린샷 문구가 특정 레시피 내용이 아니라 범용
     안내문이라 별도 데이터 파이프라인이 필요 없다고 판단.
- **영향**: `RecipeRead`/`RecommendedRecipe` 응답 필드 추가(`docs/api-contract.md` v0.6).
  기존에 시드/캐시된 레시피는 이 4개 필드가 `null`일 수 있고, 프론트는 값이 없으면 해당
  UI 요소를 표시하지 않는다.

## DL-018 | 2026-08-06 | Decided(버그 수정) | 추천 요청 동시 중복 시 llm_cache 경쟁 처리
- **배경**: 사용자가 레시피 서칭(추천 요청) 중 "데이터를 불러오지 못했습니다" 에러를
  겪었다. 로그를 확인해 `POST /recommendations`가
  `sqlalchemy.exc.IntegrityError: duplicate key value violates unique constraint
  "ix_llm_cache_ingredients_hash"`로 500을 내는 것을 발견했다. `RecipeListPage.tsx`가
  `useEffect`에서 `createRecommendation`을 가드 없이 호출해(React 19 StrictMode가 개발
  모드에서 effect를 두 번 실행) 같은 재료/신선도 조합으로 거의 동시에 두 요청이 들어가면,
  둘 다 `llm_cache` 캐시 미스를 보고 Gemini를 호출한 뒤 같은 `ingredients_hash`로 INSERT를
  시도해 두 번째가 unique 제약을 위반한 것 — DL-014(세션 생성 경쟁)와 근본 원인이 동일한
  패턴이다.
- **결정 (2026-08-06)**: `recommendation_service._get_gemini_recipes`에서
  `llm_cache_repo.create` 호출을 `IntegrityError`로 감싸 잡고, 잡히면 롤백 후 같은 해시로
  다시 조회해 다른 요청이 이미 커밋한 캐시 행을 그대로 써서 응답한다(DL-014와 동일한
  롤백+재조회 패턴, `cached=True`로 반환). 프론트의 `useEffect` 가드는 별도로 손대지
  않았다 — 근본 원인(동시 중복 요청 자체)을 프론트에서 막기보다, 백엔드가 동시 요청에
  안전하도록(idempotent) 만드는 쪽을 택했다(외부 API/DB 경쟁이 전체 요청 실패로 이어지지
  않아야 한다는 CLAUDE.md 규칙 9와 동일한 방향).
  구현: `backend/app/services/recommendation_service.py`.
  회귀 테스트: `backend/tests/api/test_recommendations.py::test_concurrent_identical_requests_recover_from_cache_race`.
- **영향**: 없음(버그 수정, API 계약 변경 아님).

## DL-019 | 2026-08-06 | Decided(버그 수정) | 조리 순서 파싱이 줄바꿈 없는 Gemini 응답을 처리 못함
- **배경**: 사용자가 실제 화면에서 "조리 순서"부터 목표 디자인과 완전히 다르게 보인다고
  보고했다. 실제 문제의 레시피(`GET /recipes/07d9714d-...`)를 API로 직접 조회해
  `instructions` 원문을 확인한 결과, `"1. 돼지고기와 양파를... 2. 냄비에... 3. 간장을...
  4. 마지막에..."`처럼 **줄바꿈 없이 한 줄에 공백으로만 이어진** 문자열이었다.
  `frontend/src/features/recipe/instructions.ts`의 `splitInstructionSteps`는 `\n` 기준으로
  줄을 나눈 뒤에만 번호를 인식했기 때문에, 이 경우 전체 문자열을 "1단계" 하나로 취급하고
  "2. 3. 4." 표시는 그 단계 텍스트 안에 그냥 문자로 남아 있었다(BL-12에서 시드 데이터의
  `\n` 구분 형식만 보고 설계한 것이 원인 — 실제 Gemini 응답은 항상 그렇게 오지 않는다).
- **결정 (2026-08-06)**: 줄 단위 분리 대신, 문자열 전체에서 "숫자+마침표+공백"
  패턴(`/\d+\.\s+/g`) 자체를 단계 구분자로 찾아 그 사이 텍스트를 각 단계로 잘라낸다.
  줄바꿈 유무와 무관하게 동작하며, `"1.5컵"`처럼 마침표 뒤 공백이 없는 소수점 표기는
  구분자로 오인하지 않는다.
  구현: `frontend/src/features/recipe/instructions.ts`.
  회귀 테스트: `frontend/src/features/recipe/instructions.test.ts`(줄바꿈 없는 실제 응답
  재현 케이스, 소수점 표기 오인 방지 케이스 추가).
- **영향**: 없음(프론트 전용 파싱 버그 수정, API 계약 변경 아님).

## DL-020 | 2026-08-07 | Decided | 홈페이지 개편(BL-13) — 자유 재료명 검색 아키텍처
- **배경**: 사용자가 다른 프로젝트용으로 작성된 것처럼 보이는 홈페이지 참고 코드(JSX,
  `@app/@pages/@features/@shared` 별칭, localStorage 전용 session_id, `/recipes/recommend`
  등)를 주며 "이 구조/디자인대로 프론트를 만들고 백엔드도 맞춰 구축해달라"고 요청했다.
  참고 코드의 세션/추천 설계가 기존 결정(DL-003 세션 등록 흐름, `POST /recommendations`의
  fridge_item_id 기반 신선도 가중치)과 충돌해 확인 질문을 거쳤다.
- **결정**:
  1. **세션**: 참고 코드의 localStorage 전용 `session_id`(백엔드 등록 없음)로 바꾸지 않고
     기존 `SessionContext`/`POST /sessions`(DL-003)를 그대로 쓴다 — 안 그러면
     `fridge_items`/`saved_recipes` 등 FK 기반 기능이 깨진다.
  2. **자유 재료명 검색**: 기존 `POST /recommendations`(fridge_item_ids 기반)에 끼워넣지
     않고 `POST /api/v1/recipes/search`(§9)를 신설했다. 신선도 개념이 없는 이 흐름을 위해
     `recommendation_service.py`의 캐시 조회/Gemini 호출/경쟁 상태 방어(DL-018) 로직을
     `_get_or_create_gemini_recipes`로 뽑아 두 흐름이 공유하게 리팩터링했고, 프롬프트/캐시
     네임스페이스는 `search_v1`으로 분리했다(`compute_search_hash`,
     `backend/app/prompts/recipe_search_v1.txt`). 마스터에 없는 재료명은 DB 매칭에서만
     제외하고 Gemini 프롬프트에는 그대로 들어간다(DL-007을 이 특정 용도로 확장 해석한 것 —
     `POST /ingredients` 자유 등록 허용 여부 자체는 여전히 Open).
  3. **최근 본 레시피**: 참고 코드의 localStorage 캐시 + 가짜 `PLACEHOLDER_RECIPES`는 쓰지
     않는다. 이미 있는 백엔드 조회 이력 기반 `useRecentRecipes()`를 그대로 쓰고 카드 UI만
     새 가로 슬라이더로 바꿨다 — 실제 데이터가 없을 때 가짜 레시피를 보여주지 않기 위함.
  4. **폴더 구조**: `@app/@pages/@features/@shared` 별칭과 JSX 전환은 하지 않는다. 기존
     TypeScript 구조(`src/pages`, `src/features`, `src/layout`) 안에 디자인/마크업만
     반영했다.
  5. **전역 레이아웃**: `NavBar`/`Footer`(`frontend/src/layout/`)를 새로 만들어 지금 바로
     `AppLayout`을 교체했다. 기존 4개 nav 항목(홈/냉장고/재료추가/저장한 레시피) 중
     "재료추가"/"저장한 레시피" 직접 링크는 새 디자인에 없어 nav에서 빠졌다(페이지 자체는
     그대로 존재, 진입 경로만 좁혀짐). Footer의 `/support/*`, `/legal/*` 링크는 실제
     페이지가 없다(이번 범위 밖, 라우터에 catch-all이 없어 빈 화면으로만 보임).
  6. **이벤트**: "레시피 조회" 클릭은 기존 `recommend_request` 이벤트를 그대로 쓴다(이름
     변경 금지, CLAUDE.md 규칙 7). `metadata`가 `fridge_item_ids[]`가 아니라
     `ingredient_names[]`인 두 번째 형태를 `event-taxonomy.md`에 추가 문서화했다.
- **영향**: `frontend/src/features/ingredient/components/TopIngredientList.tsx`는 이 개편으로
  다른 곳에서도 안 쓰이게 되어 삭제했다. `RecipeListPage.tsx`는 `location.state.searchResult`
  분기만 최소로 추가했고(그 페이지 자체의 디자인 개편은 다음 라운드), `RecommendedRecipe`
  프론트 타입에 description/servings/difficulty/tip을 추가해 백엔드 스키마(DL-017)와
  다시 맞췄다.

## DL-022 | 2026-08-10 | Decided | 조리 시작/완료 기능(BL-09) 제거

- **배경**: 레시피 상세 페이지의 "이 레시피로 요리 시작" 버튼이 실제로 무엇을 하는지
  사용자가 물어서(타이머 같은 건지) 확인해보니, 화면에 경과 시간·카운트다운·알림 등
  사용자가 체감하는 기능은 전혀 없고, `cook_sessions` 테이블에 `started_at`/`completed_at`
  두 시각만 기록해 `recipe_start`/`recipe_complete` 이벤트의 `cook_session_id`로 쓰는
  순수 분석(퍼널 트래킹)용 기능이었다(DL-015). 사용자가 이 설명을 듣고 불필요하다고
  판단해 제거를 요청했다.
- **결정**: 프론트 UI(`CookModeControls`)만 지우면 이 흐름 전체가 어차피 도달 불가능해지므로,
  프론트/백엔드/DB까지 기능 전체를 제거한다. 단, `recipe_start`/`recipe_complete` 이벤트
  "정의" 자체는 `docs/event-taxonomy.md`에 기록만 남기고 지우지 않는다(CLAUDE.md 규칙 7 —
  이벤트명은 임의로 변경/삭제하지 않는다는 취지를 "현재 사용하지 않더라도 정의는 보존"으로
  해석). 실제로 이 이벤트를 발생시키는 코드는 이제 없다.
  1. **프론트**: `frontend/src/features/recipe/components/CookModeControls.tsx` 삭제,
     `RecipeDetailPage.tsx`에서 사용 제거, `features/recipe/api.ts`의
     `startCookSession`/`completeCookSession`, `features/recipe/types.ts`의
     `CookSessionStart`/`CookSessionComplete` 삭제.
  2. **백엔드**: `app/api/cook_sessions.py`, `app/services/cook_session_service.py`,
     `app/schemas/cook_session.py`, `app/repositories/cook_session_repo.py`,
     `app/models/cook_session.py` 삭제. `app/api/recipes.py`의
     `POST /{recipe_id}/cook-sessions` 라우트 제거. `app/api/router.py`,
     `app/models/__init__.py`에서 참조 제거.
  3. **DB**: `cook_sessions` 테이블을 마이그레이션(`da37dca1713e_drop_cook_sessions_table`)으로
     drop했다 — 모델을 지운 채 테이블만 남기면 나중에 누군가 `alembic revision
     --autogenerate`를 돌릴 때 의도치 않게 이 테이블을 DROP하는 마이그레이션이 섞여 나올
     위험이 있어(사용자에게 확인 후) 코드와 스키마를 함께 정리하는 쪽을 택했다.
  4. **테스트**: `backend/tests/api/test_cook_sessions.py` 삭제.
     `frontend/src/pages/RecipeDetailPage.test.tsx`에서 조리 시작/완료 관련 mock·assertion
     제거(저장 흐름 테스트는 유지).
- **영향**: `docs/api-contract.md` §7, `docs/backlog.md` BL-09, `architecture.md`의 데이터
  모델 표/§3.x 조리 시작·완료 섹션을 "제거됨"으로 갱신. `docs/event-taxonomy.md`의
  `cook_session_id` 관련 서술(DL-013 시절 프론트 임시방편 설명)도 더는 유효하지 않아
  갱신했다.

## DL-023 | 2026-08-18 | Decided(버그 수정) | Gemini 구조화 출력이 지속적으로 503/타임아웃 — 모델 교체 + thinking 비활성화

- **배경**: 배포된 서비스에서 레시피 검색이 항상 "해당 식재료로 레시피를 제작할 수
  없습니다"만 반환한다는 사용자 보고로 조사. `gemini-flash-latest`(당시 기본 모델)로
  구조화 출력(`responseSchema`) 요청을 보내면 1시간 넘게 지속적으로 `503 UNAVAILABLE
  (high demand)`가 발생했다(단순 텍스트 요청은 정상). Gemini 실패 시 DB로 폴백하는
  기존 설계(CLAUDE.md 규칙 9)는 정상 동작했지만, 로컬/프로덕션(Neon) DB 모두 레시피가
  1건뿐이라 대부분의 재료 조합에서 폴백 결과도 비어 사실상 기능이 죽어 있었다.
- **원인**: `GET /v1beta/models`로 확인해보니 `gemini-2.5-flash`는 신규 사용자에게
  더 이상 제공되지 않고(404), 최신 세대 모델(`gemini-3.x`)은 기본으로 "thinking"이
  켜져 있어 구조화 출력처럼 무거운 요청에서 응답이 40초 이상 걸리거나 503이 잦았다.
  `generationConfig.thinkingConfig.thinkingBudget: 0`으로 thinking을 끄니
  `gemini-3.5-flash`가 15~25초 안에 안정적으로 성공했다(반복 재현 확인).
- **결정**:
  1. `GEMINI_MODEL` 기본값을 `gemini-flash-latest`(롤링 별칭) → `gemini-3.5-flash`
     (고정 안정 버전)로 변경. `GEMINI_TIMEOUT_SECONDS`도 25 → 35로 상향(재시도 1회
     포함 최악 약 70초).
  2. `gemini_client.call_gemini`가 보내는 모든 요청의 `generationConfig`에
     `thinkingConfig: {thinkingBudget: 0}`을 추가 — 이 서비스는 정해진 스키마로 바로
     뽑아내는 용도라 thinking(탐색적 추론)이 필요 없다.
  3. Gemini 장애 시 폴백 결과가 비지 않도록 `app/seed/seed_recipes.py`를 레시피 1건
     하드코딩에서 **레시피 10건 목록(`RECIPE_SEEDS`) + 공용 idempotent 시딩 함수**로
     확장했다. 시드 재료 10개 조합을 골고루 커버해, 흔한 재료 조합은 Gemini 없이도
     DB만으로 3건 이상 매칭되어 즉시 응답한다(실측: "돼지고기+김치" → DB만으로 0.02초
     만에 3건).
  4. `render.yaml`의 `GEMINI_MODEL`/`GEMINI_TIMEOUT_SECONDS` 하드코딩 값과 로컬
     `backend/.env`도 함께 갱신(코드 기본값만으론 Render의 명시적 env var를 못 덮음).
- **영향**: `backend/app/core/config.py`, `backend/app/integrations/gemini_client.py`,
  `backend/app/seed/seed_recipes.py`, `backend/app/seed/run_seed.py`, `render.yaml`,
  `backend/.env.example`. DB/API 계약 변경 없음(마이그레이션 불필요). 기존 pytest
  61건 그대로 통과.

---

## 결정 요청 요약 (다음 대화에서 확인 필요)

| ID | 항목 | 상태 | 차단하는 백로그 |
|---|---|---|---|
| DL-006 | 재료 마스터 데이터의 실제 출처 | Open | 재료 시드 백로그(엑셀 교체) |
| DL-012 | DB 매칭 임계값·근접임박 가중치 튜닝 | Open | 없음(임시값으로 운영 가능) |
