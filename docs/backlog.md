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

## BL-09. 조리 시작/완료 흐름
- **목적**: 상세 페이지에서 조리 시작 후 완료까지 처리
- **범위**: `POST .../cook-sessions`, `PATCH .../complete`, 조리 모드 UI, `recipe_start`/`recipe_complete` 이벤트
- **완료 조건**: 시작~완료 상태 전이가 DB에 기록되고 이벤트가 순서대로 발생
- **진행 상태(2026-08-03)**: **완료**. `cook_sessions` 테이블 + `POST /recipes/{id}/
  cook-sessions` + `PATCH /cook-sessions/{id}/complete`를 구현(DL-015, DL-013의 이벤트 전용
  임시방편을 대체). `CookModeControls`가 이 API를 호출해 서버가 발급한 `cook_session_id`로
  `recipe_start`/`recipe_complete` 이벤트를 기록한다.

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

## 백로그 외 (별도 트랙, 이번 목록에 포함하지 않음)
- 배포/인프라, CI/CD 구성
- 성능/부하 테스트
- product-requirements.md §6에 명시된 Out-of-Scope 항목 전체
