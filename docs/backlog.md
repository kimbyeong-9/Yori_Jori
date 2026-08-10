# 백로그 (Backlog)

- 문서 버전: v0.1 (초안)
- 작성일: 2026-07-31
- 규칙: 한 번에 하나의 백로그만 구현한다 (CLAUDE.md 규칙 2). 각 항목은 독립적으로
  완료 가능한 단위로 쪼갰다. 순서는 핵심 사용자 흐름을 따른다.
- 각 항목 착수 전 "선행 Open Decision"이 있으면 [decision-log.md](./decision-log.md)에서
  먼저 상태를 `Decided`로 바꿔야 한다.

## BL-00. 프로젝트 스캐폴딩
- **목적**: architecture.md의 제안 구조대로 backend/frontend 뼈대와 최소 헬스체크만 생성
- **범위**: FastAPI 앱 부팅, Vite+React+TS 앱 부팅, 각 pyproject/package.json, `.env.example`
- **제외**: 실제 도메인 기능, DB 연결(다음 백로그)
- **선행 Open Decision**: 없음
- **완료 조건**: 백엔드 `/health`, 프론트 빈 라우트 트리(6개 페이지 placeholder)가 로컬에서 기동
- **진행 상태(2026-08-02, 5단계)**: **완료**. `frontend/`가 Vite+React19+TS로 실제
  스캐폴딩됐고 6개 라우트가 전부 실제 페이지로 채워졌다(placeholder 단계를 건너뜀).

## BL-01. 세션 식별 기초
- **목적**: 비로그인 세션 식별자를 프론트-백엔드가 일관되게 주고받도록 구현
- **범위**: 백엔드 세션 식별 미들웨어/의존성, 프론트 `SessionContext`
- **선행 Open Decision**: 없음 (DL-003 Decided, 2026-07-31)
- **완료 조건**: 임의 API 호출 시 세션이 생성/유지되고 재방문 시 동일 세션으로 인식됨을 테스트로 확인
- **진행 상태(2026-08-02, 5단계)**: **완료**. 프론트 `SessionContext`
  (`frontend/src/context/SessionContext.tsx`)가 `browser_uuid`/`session_id`를
  localStorage에 캐시하고 `POST /sessions`로 재검증한다. 브라우저 검증 중 발견한 세션
  생성 동시성 버그는 백엔드에서 수정(DL-014).

## BL-02. 이벤트 수집 인프라
- **목적**: `docs/event-taxonomy.md`의 이벤트를 실제로 기록할 수 있는 최소 파이프라인 구축
- **범위**: 백엔드 `POST /api/v1/events` + `AnalyticsEvent` 모델/마이그레이션, 프론트 `analytics/` 발행 유틸(이벤트명 상수화)
- **선행 Open Decision**: 없음 (DL-008 Decided, 2단계)
- **완료 조건**: 정의되지 않은 이벤트명 전송 시 400, 정의된 이벤트는 저장됨을 테스트로 확인
- **진행 상태(2026-08-02, 5단계)**: **완료**. `frontend/src/features/analytics/`
  (`eventTypes.ts`, `track.ts`)가 11개 이벤트를 상수화해 각 페이지에서 발행한다.

## BL-03. 재료 마스터 데이터 및 조회 API
- **목적**: 자동완성/등록의 기반이 되는 재료 마스터 확보
- **범위**: `Ingredient` 모델/마이그레이션, pandas/openpyxl 기반 시드 스크립트, `GET /api/v1/ingredients`
- **선행 Open Decision**: DL-006 (데이터 소스 — Top10 임시 시드로 진행 중, 실제 출처는 Open)
- **완료 조건**: 시드 후 검색 API가 부분 일치 결과를 반환
- **진행 상태(2026-07-31, 3단계)**: **모델/시드/API 구현 완료** —
  `GET /api/v1/ingredients` (`query`/`category`/`top` 필터).

## BL-04. IngredientAddPage — 재료 등록
- **목적**: 사용자가 재료를 검색해 냉장고에 추가
- **범위**: `/ingredients/new` 페이지, `POST /api/v1/fridge`, `ingredient_search`/`ingredient_added` 이벤트 발행
- **선행 Open Decision**: DL-007 (자유 등록 허용 여부, `POST /ingredients` 미구현 — 검색
  결과 안에서만 선택 가능한 현재 흐름은 이 결정과 무관하게 동작)
- **완료 조건**: 검색 → 신선도 지정 → 추가까지 E2E로 냉장고에 반영, 관련 이벤트 발생 확인
- **진행 상태(2026-08-02, 5단계)**: **완료**. `frontend/src/pages/IngredientAddPage.tsx` —
  검색(`ingredient_search`) → 선택 → fresh/near_expiry 선택(`freshness_selected`) →
  등록(`ingredient_added`) → `/fridge` 이동까지 Playwright로 실제 확인.

## BL-05. FridgePage — 냉장고 목록/선택/신선도 변경
- **목적**: 등록된 재료를 조회하고 추천에 사용할 재료를 선택
- **범위**: `GET/PATCH/DELETE /api/v1/fridge`, 다중 선택 UI, `ingredient_selected`/`freshness_selected` 이벤트
- **선행 Open Decision**: 없음 (DL-010 Decided, 2026-07-31)
- **완료 조건**: 선택 상태가 다음 백로그(추천 요청)에 전달 가능한 형태로 유지됨
- **진행 상태(2026-08-02, 5단계)**: **완료**. `frontend/src/pages/FridgePage.tsx` —
  카테고리 탭, 선택(`ingredient_selected`), 수정/삭제, 선택 재료로 추천 요청
  (`recommend_request` → `/recipes?fridge_item_ids=`).

## BL-06. 추천 요청 및 Gemini 연동 → RecipeListPage
- **목적**: 선택 재료로 추천을 요청하고 목록을 표시
- **범위**: `integrations/gemini_client`, `POST /api/v1/recommendations`, `/recipes` 페이지,
  `recommend_request`/`recommendation_impression`/`recipe_click` 이벤트
- **선행 Open Decision**: 없음 (DL-005/DL-009 Decided)
- **완료 조건**: 정상 케이스 목록 표시 + Gemini 실패를 모킹했을 때 다른 기능(냉장고 등)이 영향받지 않음을 테스트로 확인 (CLAUDE.md 규칙 9)
- **진행 상태(2026-08-02, 5단계)**: **완료**. `frontend/src/pages/RecipeListPage.tsx` —
  DB/AI 출처 배지, 매칭/부족 재료, 결과 없음 상태, `recommendation_impression`/
  `recipe_click` 이벤트.

## BL-07. RecipeDetailPage — 상세 조회
- **목적**: 레시피 상세 정보 표시
- **범위**: `GET /api/v1/recipes/{id}`, 상세 페이지 UI, `recipe_detail_view` 이벤트
- **선행 Open Decision**: 없음 (DL-005 Decided, 2단계)
- **완료 조건**: 추천 목록에서 클릭 → 상세 진입까지 E2E 확인
- **진행 상태(2026-08-02, 5단계)**: **완료**. `GET /recipes/{id}`에 `ingredients` 필드를
  추가(5단계 승인된 API 확장)해 저장목록/최근본레시피 등 어떤 경로로 들어와도
  `frontend/src/pages/RecipeDetailPage.tsx`가 보유/부족 재료를 계산할 수 있게 했다.

## BL-08. 레시피 저장 → SavedRecipesPage
- **목적**: 관심 레시피 저장 및 목록 조회
- **범위**: `POST/DELETE /api/v1/recipes/{id}/save`, `GET /api/v1/saved-recipes`, `/saved` 페이지, `recipe_save` 이벤트
- **완료 조건**: 저장 → SavedRecipesPage 반영 → 저장 취소까지 E2E 확인
- **진행 상태(2026-08-02, 5단계)**: **완료**. `frontend/src/pages/SavedRecipesPage.tsx` —
  목록/저장일/상세 이동/저장 해제/빈 상태.

## BL-09. 조리 시작/완료 흐름 — 제거됨
- **목적**: 상세 페이지에서 조리 시작 후 완료까지 처리
- **범위**: `POST .../cook-sessions`, `PATCH .../complete`, 조리 모드 UI, `recipe_start`/`recipe_complete` 이벤트
- **완료 조건**: 시작~완료 상태 전이가 DB에 기록되고 이벤트가 순서대로 발생
- **진행 상태(2026-08-03)**: 완료했었음(`cook_sessions` 테이블 + API + `CookModeControls`
  UI, DL-015).
- **진행 상태(2026-08-10)**: **제거**(DL-022). 화면에 타이머/경과 시간 같은 사용자 가치가
  없고 시작~완료 시각만 서버에 기록하는 분석 전용 기능이라 필요 없다고 판단, 프론트
  `CookModeControls`/API 함수, 백엔드 `cook-sessions` 라우트/서비스/스키마/레포지토리/모델,
  `cook_sessions` 테이블(마이그레이션으로 drop)까지 전부 제거했다. `recipe_start`/
  `recipe_complete` 이벤트 정의는 `event-taxonomy.md`에 기록만 남겨둔다(CLAUDE.md 규칙 7 —
  이벤트명 자체는 삭제하지 않음, 현재는 어떤 코드도 발생시키지 않음).

## BL-10. HomePage
- **목적**: 핵심 흐름 진입점 제공 (다른 백로그가 끝난 뒤 조립하는 성격이 강함)
- **범위**: `/` 페이지, 냉장고/등록/저장 진입 링크
- **완료 조건**: 각 진입점에서 해당 페이지로 정상 이동
- **진행 상태(2026-08-02, 5단계)**: **완료**. `frontend/src/pages/HomePage.tsx` — 검색창,
  Top10 재료, 냉장고 요약(+선택해서 추천 조회), 최근 본 레시피, 재료 추가 진입점.
- **2026-08-07 갱신**: BL-13에서 이 페이지가 자유 재료명 검색 중심으로 다시 만들어져
  대체됐다(냉장고 요약/Top10 재료/재료 추가 진입점은 페이지에서 빠짐 — 기능은 `/fridge`에
  그대로 있음).

## BL-11. 냉장고 재료 기한 자동 삭제 + 임박 3시간 카운트다운
- **목적**: 기한(action_due_at)이 지난 냉장고 재료를 자동으로 정리하고, 임박 3시간 전부터
  재료별로 "N시간 남음"을 표시해 사용자가 소비기한을 놓치지 않게 한다.
- **범위**: `GET /fridge-items` 조회 시점 lazy cleanup, `FridgeItemCard` 카운트다운 배지,
  `useFridgeItems` 60초 폴링
- **완료 조건**: 기한이 지난 재료가 다음 조회에서 응답에 빠지고 실제로 DB에서 삭제됨,
  3시간 이하로 남은 재료는 "N시간 남음" 배지가 뜨고 시간이 줄어들면서 갱신됨
- **진행 상태(2026-08-06)**: **완료**(DL-016). 백엔드
  `backend/app/repositories/fridge_item_repo.py`(`delete_expired`),
  `backend/app/services/fridge_service.py`. 프론트
  `frontend/src/features/fridge/countdown.ts`,
  `frontend/src/features/fridge/components/FridgeItemCard.tsx`,
  `frontend/src/features/fridge/useFridgeItems.ts`.

## BL-12. RecipeDetailPage UI 개편 + 인분/난이도/한줄소개/팁
- **목적**: 목표 스크린샷 기준으로 레시피 상세 페이지를 다시 만들고, 이를 위해 필요한
  인분 수·난이도·한 줄 소개·셰프의 팁 데이터를 `recipes`에 추가해 Gemini가 생성하도록 한다.
- **범위**: `recipes` 스키마 확장(마이그레이션), Gemini 프롬프트 v2 + 구조화 출력 스키마
  확장, `RecipeDetailPage`/`RecipeIngredientList` 재구성, 조리 순서 번호 파싱, 찜/링크
  아이콘, AI 생성 안내문
- **완료 조건**: `/recipes/:id`가 새 레이아웃으로 렌더링되고, Gemini로 새로 생성된
  레시피는 인분/난이도/한줄소개/팁이 채워진 채 상세 페이지에 표시됨
- **진행 상태(2026-08-06)**: **완료**(DL-017). 백엔드
  `backend/app/models/recipe.py`, `backend/app/prompts/recipe_recommendation_v2.txt`,
  `backend/app/services/recommendation_service.py`. 프론트
  `frontend/src/pages/RecipeDetailPage.tsx`, `frontend/src/components/icons.tsx`,
  `frontend/src/features/recipe/instructions.ts`,
  `frontend/src/features/recipe/components/RecipeIngredientList.tsx`.

## BL-13. HomePage 개편 — 자유 재료명 검색 + 새 NavBar/Footer
- **목적**: 사용자가 준 참고 디자인대로 홈페이지를 자유 재료명 검색 중심 진입점으로
  다시 만들고, 이를 위한 검색 전용 백엔드 경로와 새 전역 레이아웃(NavBar/Footer)을
  갖춘다.
- **범위**: `POST /api/v1/recipes/search`(§9), `recommendation_service.py` 리팩터링
  (`_get_or_create_gemini_recipes` 공유 추출), `recipe_search_v1.txt` 프롬프트,
  `compute_search_hash`, `frontend/src/layout/NavBar.tsx`/`Footer.tsx`,
  `HomePage.tsx` 전체 재작성, `RecipeListPage.tsx`의 `location.state` 결과 수신 분기
- **완료 조건**: 홈페이지에서 재료명을 자유 입력해 레시피 조회 → `/recipes`에서 결과 확인,
  새 NavBar/Footer가 전체 앱에 적용됨
- **진행 상태(2026-08-07)**: **완료**(DL-020).

## BL-14. FridgePage 개편 — 관리모드 토글 + 태그형 선택 UI
- **목적**: 사용자가 준 참고 디자인(다른 프로젝트용으로 작성된 코드)의 UI/UX를 실제
  아키텍처(서버 `fridge_items` 기반, 기존 이벤트/API)에 맞게 이식한다.
- **범위**: `FridgePage.tsx` 전면 재작성(관리모드 토글, 카테고리 탭, 태그형 재료 버튼,
  선택 칩, 하단 액션바), `AddFridgeItemModal.tsx`/`EditFridgeItemPanel.tsx` 신규,
  `FridgeItemCard.tsx` 삭제(신규 UI로 대체)
- **선행 조건**: 없음(BL-15 완료로 자유 재료 등록 API는 준비됨 — 모달에서 활용 가능)
- **완료 조건**: 재료 검색/자유 등록으로 추가 → 관리모드에서 수정/삭제 → 선택 모드에서
  선택 후 추천 요청까지 E2E로 확인, 기존 이벤트(`ingredient_selected`,
  `freshness_selected`, `ingredient_added`, `recommend_request`) 그대로 발행
- **진행 상태(2026-08-10)**: **완료**.
  `frontend/src/pages/FridgePage.tsx`,
  `frontend/src/features/fridge/components/AddFridgeItemModal.tsx`,
  `frontend/src/features/fridge/components/EditFridgeItemPanel.tsx`,
  `frontend/src/components/icons.tsx`(`FridgeIcon`/`PlusIcon`/`PencilIcon` 추가). 기존
  `FridgeItemCard.tsx`는 태그형 UI로 대체되어 삭제. 실제 Gemini 키로 브라우저에서
  검색 선택/자유 등록(예: "파프리카" → 채소로 자동 분류)/관리모드 수정·삭제/선택 후
  추천 요청 이동까지 E2E로 확인(콘솔 에러 없음). 테스트:
  `frontend/src/pages/FridgePage.test.tsx`(빈 상태, 선택→추천 이동, 관리모드 수정/삭제,
  추가 모달 검색 선택 케이스).

## BL-15. 자유 재료 등록 — `POST /api/v1/ingredients`
- **목적**: 마스터에 없는 재료 이름도 등록할 수 있게 한다(DL-007 (a)로 확정).
- **범위**: `POST /api/v1/ingredients`(이름만 입력받고 category/unit은 Gemini 검증으로
  서버가 결정), `GeminiIngredientValidation` 스키마, `ingredient_validation_v1.txt`
  프롬프트, `call_gemini`의 `response_schema` 파라미터 일반화, `ExternalServiceError`(503)
- **완료 조건**: 신규 재료명 등록 시 Gemini 검증을 거쳐 생성/거부되고, 이미 있는 이름은
  중복 생성 없이 기존 재료를 재사용, Gemini 장애 시 503으로 명확히 실패(다른 API에는
  영향 없음)
- **진행 상태(2026-08-10)**: **완료**(DL-007). 백엔드
  `backend/app/api/ingredients.py`, `backend/app/services/ingredient_service.py`,
  `backend/app/repositories/ingredient_repo.py`, `backend/app/schemas/gemini.py`,
  `backend/app/schemas/ingredient.py`, `backend/app/core/errors.py`,
  `backend/app/integrations/gemini_client.py`,
  `backend/app/prompts/ingredient_validation_v1.txt`. 프론트
  `frontend/src/features/ingredient/api.ts`(`createIngredient`, UI 연결은 BL-14).
  테스트: `backend/tests/api/test_ingredients.py`(중복 재사용/정상 생성/비식용 거부/Gemini
  장애 케이스).

## BL-16. 세션 재료 불러오기 (미착수)
- **목적**: 참고 디자인이 기대한 "최근 검색/조회한 재료를 냉장고로 가져오기" 기능.
- **범위**: 아직 미정. `interaction_logs`(이벤트 로그) 기반으로 "세션의 최근 재료" 개념을
  새로 정의하고 조회 API를 설계해야 한다 — 현재 백엔드에 대응하는 엔드포인트가 없다.
- **선행 조건**: API 설계 논의 필요(이번 범위에서 다루지 않기로 결정, DL-007 결정 기록
  참조). 착수 전 이 backlog 항목을 구체화해야 한다.
- **진행 상태(2026-08-10)**: 미착수 — 등록만 해둠.

## BL-17. RecipeListPage 개편 — 선택 식재료 칩 + 카드 그리드 리스타일
- **목적**: 사용자가 준 참고 디자인(다른 프로젝트용으로 작성된 코드)의 UI를 실제 데이터
  흐름(쿼리 `fridge_item_ids` → `POST /recommendations`, 또는 `location.state.searchResult`)
  에 맞게 이식한다.
- **범위**: `RecipeListPage.tsx` 재작성(선택 식재료 칩 행, 카드 그리드 리스타일, 정렬
  아이콘은 시각적 자리만), `RecipeResultCard.tsx` 리스타일(보유/부족 재료 배지·난이도
  배지는 유지), `HomePage.tsx`/`FridgePage.tsx`가 `location.state.ingredientNames`를
  추가로 넘기도록 변경(칩 표시용, 레시피 조회 로직 자체는 변경 없음)
- **완료 조건**: 홈 자유검색·냉장고 선택 두 경로 모두에서 선택 식재료 칩이 보이고,
  카드 클릭 시 상세 페이지로 이동, 기존 이벤트(`recommendation_impression`,
  `recipe_click`) 그대로 발행
- **진행 상태(2026-08-10)**: **완료**. 실제 Gemini 키로 브라우저에서 홈 검색("계란",
  "양파") → 선택 식재료 칩 2개 + AI 생성 레시피 카드 5개(보유/부족 재료·난이도 배지
  포함) → 카드 클릭 시 상세 페이지 이동까지 확인(콘솔 에러 없음). 테스트:
  `frontend/src/pages/RecipeListPage.test.tsx`(기존 4개 케이스 + 선택 식재료 칩 표시
  케이스), `HomePage.test.tsx`/`FridgePage.test.tsx`의 navigate 호출 인자 갱신.

## BL-18. RecipeDetailPage 개편 — 비주얼 리스타일
- **목적**: 참고 디자인(다른 프로젝트용으로 작성된 코드, NavBar/Footer 중복 렌더링·
  localStorage 저장·`recipe_unsave`(존재하지 않는 이벤트명)·조리 시작 기능 없음 등 실제
  아키텍처와 맞지 않는 부분 다수)의 비주얼만 반영한다.
- **범위**: `RecipeDetailPage.tsx` 재작성(메타 칩, sticky 재료 카드, 큰 번호 조리순서,
  팁/안전 유의사항 카드), `RecipeIngredientList.tsx`/`CookModeControls.tsx` 리스타일,
  `icons.tsx`에 `LightbulbIcon`/`AlertTriangleIcon`/`CheckIcon` 추가. 실제 저장 API
  (`saved-recipes`), `recipe_save`/`recipe_detail_view`/`recipe_start`/`recipe_complete`
  이벤트, 보유/부족 재료 매칭, `splitInstructionSteps`(DL-019), `is_llm_generated` 기반
  안전 유의사항 노출 조건은 모두 그대로 유지.
- **완료 조건**: 저장/저장해제, 링크 복사, 조리 시작→완료 흐름이 새 UI에서도 그대로
  동작하고 기존 이벤트가 그대로 발행됨
- **진행 상태(2026-08-10)**: **완료**. 실제 Gemini 키로 브라우저에서 저장 토글(하트
  채워짐)→링크 복사(체크 아이콘 전환)→조리 시작→완료(다시 조리하기 노출)까지 전부
  확인(콘솔 에러 없음). 기존 `RecipeDetailPage.test.tsx`(보유/부족·저장·조리 흐름,
  AI 안전 유의사항 케이스)는 변경 없이 그대로 통과.

## BL-19. SavedRecipesPage 개편 — 카드 그리드 + 클라이언트 페이지네이션
- **목적**: 참고 디자인(다른 프로젝트용으로 작성된 코드, `localStorage`/존재하지 않는
  `GET /logs/interactions/{sessionId}`·`recipe_unsave` 이벤트 등 실제 아키텍처와 맞지
  않는 부분 다수)의 비주얼만 반영한다.
- **범위**: `SavedRecipesPage.tsx` 재작성(헤더, 빈 상태, 카드 그리드, 6개씩 클라이언트
  페이지네이션 — 7개 이상일 때만 노출), `SavedRecipeCard.tsx` 리스타일(우상단 하트
  아이콘을 실제 저장 해제 버튼으로 사용). 실제 `listSavedRecipes`/`unsaveRecipe`
  API(`GET`/`DELETE /saved-recipes`)는 그대로 유지, 이벤트 추가 발행 없음(기존과 동일).
  페이지네이션은 이미 받아온 전체 목록을 프론트에서만 자르는 순수 UI 기능이라 백엔드
  페이지네이션 Open 결정(api-contract.md 하단)과 무관.
- **완료 조건**: 목록 표시, 카드 클릭 시 상세 이동, 하트 클릭으로 저장 해제, 7개 이상일
  때 페이지 이동까지 동작
- **진행 상태(2026-08-10)**: **완료**. 실제 Gemini 키로 브라우저에서 빈 상태 →
  레시피 2개 저장 → 목록 확인 → 하트 클릭으로 해제까지 확인(콘솔 에러 없음). 테스트:
  `frontend/src/pages/SavedRecipesPage.test.tsx`(기존 2개 케이스 문구 갱신 + 페이지네이션
  케이스 추가).

## BL-20. 약관/고객지원 정적 페이지 6종
- **목적**: `Footer`에 이미 걸려 있던 `/legal/*`, `/support/*` 링크(DL-020에서 "실제 페이지가
  없어 범위 밖"으로 남겨뒀던 부분)를 채운다. product-requirements.md의 명시적 제외 범위(§6)에
  해당하지 않는 순수 추가 정적 콘텐츠라 다른 기능과 충돌 없음.
- **범위**: `TermsPage`/`PrivacyPage`/`CookiePage`/`HelpPage`/`SafetyPage`/`ContactPage`
  6개 페이지, 공용 `StaticPageLayout` 컴포넌트, `App.tsx` 라우트 6개 추가
  (`/legal/terms`, `/legal/privacy`, `/legal/cookie`, `/support/help`, `/support/safety`,
  `/support/contact`). 백엔드/이벤트/기존 페이지 로직 변경 없음.
- **완료 조건**: Footer의 6개 링크가 모두 실제 페이지로 연결됨
- **진행 상태(2026-08-10)**: **완료**. 실제 앱과 맞지 않는 레퍼런스 내용(존재하지 않는
  음성 입력 기능 언급, 실제와 다른 신선도 라벨 표기)은 수정해서 반영. 테스트:
  `frontend/src/pages/StaticPages.test.tsx`(6개 페이지 제목 렌더링 확인). CLAUDE.md 페이지
  테이블에 6개 경로 추가.

## 백로그 외 (별도 트랙, 이번 목록에 포함하지 않음)
- 배포/인프라, CI/CD 구성
- 성능/부하 테스트
- product-requirements.md §6에 명시된 Out-of-Scope 항목 전체
