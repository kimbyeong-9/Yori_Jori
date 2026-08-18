# CLAUDE.md — 리쿡 (ReCook) 작업 규칙

이 문서는 이 저장소에서 AI(및 인간) 개발자가 따라야 하는 기준 규칙이다.
기능 구현 전 반드시 이 문서와 관련 문서를 확인한다.

> 서비스명은 2026-08에 "요리조리(Yori Jori)"에서 "리쿡(ReCook)"으로 변경됐다. 저장소
> 폴더명·GitHub 저장소명·Render/Vercel/Neon 등 배포 리소스 이름은 인프라 변경(URL 파손
> 위험)이라 그대로 두고, 화면에 보이는 텍스트/색상만 이번에 바꿨다.

## 제품 한 줄 요약

냉장고에 남은 식재료를 등록한 사용자가 반복 검색 없이 조리 가능한 메뉴를 선택하고,
상세 레시피 확인·저장·조리 시작까지 이어지는 웹 MVP.

핵심 흐름: 재료 등록 → 냉장고 재료 선택 → 추천 요청 → 추천 목록 → 레시피 상세 →
저장 또는 조리 시작 → 조리 완료

## 기술 스택

**Backend**: Python 3.11+, FastAPI, Uvicorn, PostgreSQL, SQLModel, Alembic,
Pydantic Settings, HTTPX AsyncClient, Gemini API(구조화 출력), pandas, openpyxl, pytest

**Frontend**: React 19, Vite, TypeScript, React Router, Tailwind CSS, Axios,
Session Context, Vitest, React Testing Library

## 페이지

| 경로 | 페이지 |
|---|---|
| `/` | HomePage |
| `/fridge` | FridgePage |
| `/ingredients/new` | IngredientAddPage |
| `/recipes` | RecipeListPage |
| `/recipes/:id` | RecipeDetailPage |
| `/saved` | SavedRecipesPage |
| `/legal/terms` | TermsPage |
| `/legal/privacy` | PrivacyPage |
| `/legal/cookie` | CookiePage |
| `/support/help` | HelpPage |
| `/support/safety` | SafetyPage |
| `/support/contact` | ContactPage |

## 작업 전 필독 문서

1. [architecture.md](./architecture.md) — 시스템 구조, 레이어링, 데이터 모델, 외부 연동 정책
2. [docs/product-requirements.md](./docs/product-requirements.md) — 제품 범위/제외 범위
3. [docs/backlog.md](./docs/backlog.md) — 지금 어떤 백로그를 다루는지, 선행 조건
4. [docs/decision-log.md](./docs/decision-log.md) — 착수할 백로그를 막는 Open Decision이 있는지
5. API를 다루는 작업이면 [docs/api-contract.md](./docs/api-contract.md)
6. 이벤트/분석을 다루는 작업이면 [docs/event-taxonomy.md](./docs/event-taxonomy.md)

## 작업 규칙 (필수)

1. 작업 전 `architecture.md`와 관련 문서를 읽는다.
2. 한 번에 하나의 백로그만 구현한다.
3. 요청하지 않은 기능은 추가하지 않는다.
4. 기존 파일과 사용자 작업을 임의로 삭제하지 않는다.
5. API 변경 시 `api-contract.md`와 프론트 타입을 함께 수정한다.
6. DB 변경 시 Alembic migration을 생성한다.
7. 이벤트 이름을 임의로 변경하지 않는다.
8. Gemini 응답은 Pydantic 스키마로 검증한다.
9. 외부 API 실패가 전체 서비스 장애로 이어지지 않게 한다.
10. 관련 없는 파일은 수정하지 않는다.
11. 구현 전 수정할 파일과 작업 계획을 먼저 제시한다.
12. 작업 후 변경 파일, 테스트 결과, 남은 문제를 보고한다.

## 핵심 이벤트

`ingredient_search`, `ingredient_added`, `ingredient_selected`, `freshness_selected`,
`recommend_request`, `recommendation_impression`, `recipe_click`, `recipe_detail_view`,
`recipe_save`, `recipe_start`, `recipe_complete`

전체 정의(발생 시점, 속성)는 [docs/event-taxonomy.md](./docs/event-taxonomy.md) 참조.

## 작업 진행 방식

- 백로그 착수 전: 해당 항목이 [docs/decision-log.md](./docs/decision-log.md)에서 아직
  `Open`인 선행 결정에 막혀 있는지 확인한다. 막혀 있으면 구현하지 말고 사용자에게 결정을
  요청한다.
- 계획 제시(규칙 11): 수정/생성할 파일 목록과 접근 방식을 먼저 제시하고 승인을 받은 뒤
  구현한다.
- 완료 보고(규칙 12): 변경된 파일 목록, 실행한 테스트와 결과, 남아있는 문제/후속 필요
  작업을 명시한다.
- 문서와 코드가 어긋나면 코드를 문서에 맞추거나, 문서를 갱신할 필요가 있으면 그 갱신도
  작업의 일부로 명시하고 진행한다 (임의로 조용히 무시하지 않는다).

## 실행 명령

백엔드(세션·재료·냉장고·레시피 조회·저장·이벤트·추천)와 프론트엔드(6개 페이지) 모두
구현되어 있다.

**주의**: `backend/tests`는 `TEST_DATABASE_URL`이 가리키는 DB에 대해 매 세션마다
`alembic downgrade base` → `upgrade head`를 실행해 스키마를 초기화한다. 로컬 수동
검증용으로 쓰던 DB와 테스트 DB를 같은 값으로 두면 pytest 실행 한 번에 시드/입력 데이터가
전부 사라진다 — 수동 검증 후 다시 확인하려면 `python -m app.seed.run_seed`를 재실행한다.

```bash
cd backend

# 의존성 설치 (Python 3.11)
uv sync --python 3.11

# 로컬 개발/테스트용 Postgres (Docker) — 이름 고정 + 재시작 정책으로 한 번만 만들고
# 이후에는 docker stop/start로만 관리한다 (--rm으로 띄우면 Docker/시스템 재시작 시
# 컨테이너가 통째로 삭제되어 데이터가 날아간다).
docker run -d --name yorijori-test-db --restart unless-stopped \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=yorijori_test \
  -p 55432:5432 postgres:16
# 이미 만들어 놨다면 (재부팅 등으로 꺼져 있을 때):
docker start yorijori-test-db

# .env 준비 (DATABASE_URL, GEMINI_API_KEY, GEMINI_MODEL 등)
cp .env.example .env
# GEMINI_API_KEY를 비워두면 /recommendations는 Gemini 호출이 항상 실패해 DB 추천
# 결과로만 폴백한다(에러는 아님) — 로컬 개발 시 키가 없어도 서버는 정상 동작한다.

# 마이그레이션 적용
uv run alembic upgrade head

# 재료/레시피 시드 (idempotent)
uv run python -m app.seed.run_seed

# API 서버 실행 (Swagger UI: http://127.0.0.1:8000/docs)
uv run uvicorn app.main:app --reload

# 테스트 (TEST_DATABASE_URL로 별도 테스트 DB 지정, 기본값은 위 컨테이너를 55432로 매핑한 값)
TEST_DATABASE_URL="postgresql+psycopg://postgres:postgres@localhost:55432/yorijori_test" \
  uv run pytest -v
```

새 모델을 추가/변경하면 `uv run alembic revision --autogenerate -m "..."`으로 마이그레이션을
생성한 뒤 diff를 검토하고 커밋한다 (CLAUDE.md 규칙 6).

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 (백엔드가 :8000에서 떠 있어야 한다 — vite.config.ts가 /api를 프록시해
# 로컬에서는 동일 출처처럼 동작한다. 배포 환경에서만 CORS 미들웨어가 실제로 쓰인다)
npm run dev

# 빌드 (tsc + vite build)
npm run build

# 테스트 (Vitest + React Testing Library, 네트워크는 각 feature api.ts를 vi.mock으로 대체)
npm run test
```

## 배포

프론트(Vercel) + 백엔드(Render) + DB(Neon)로 나눠서 배포한다(2026-08-11 Neon 연결
완료, 셋 다 무료 플랜으로 상시 운영 중). Vercel 서버리스는 Gemini 호출이 Hobby 플랜
함수 타임아웃(10초)을 넘겨 백엔드로는 안 맞는다고 판단해 상시 프로세스가 가능한
Render를 택했다.

- **백엔드(Render)**: 저장소 루트의 `render.yaml`(Blueprint)로 배포한다. `rootDir:
  backend`, 빌드 시 `uv sync` 후 `alembic upgrade head` + `run_seed`까지 자동
  실행(둘 다 idempotent), 실행 `uv run uvicorn app.main:app --host 0.0.0.0 --port
  $PORT`. `DATABASE_URL`/`GEMINI_API_KEY`는 대시보드 Environment 탭에서 직접
  입력(`sync: false`) — **복붙 시 앞뒤 공백/줄바꿈이 섞이면 Gemini가 403으로 조용히
  실패**하니 붙여넣은 뒤 꼭 재확인한다(2026-08-18 실제로 이 문제로 장애 발생, DL-023).
  `GEMINI_MODEL`/`GEMINI_TIMEOUT_SECONDS`/`CORS_ORIGINS`는 `render.yaml`에 값이
  고정되어 있어 코드 기본값과 별개로 이 파일도 같이 갱신해야 한다.
- **프론트(Vercel)**: `https://yori-jori-psi.vercel.app`. 환경변수
  `VITE_API_BASE_URL=https://yorijori-backend.onrender.com` 설정됨(없으면 로컬
  프록시를 가정한 상대 경로만 써서 배포 환경에서 API 호출이 전부 실패,
  `frontend/src/lib/apiClient.ts` 참조). `frontend/vercel.json`의 SPA rewrite(모든
  경로를 `index.html`로) 없으면 `/recipes`처럼 React Router가 처리하는 경로를 새로고침
  하거나 직접 접속할 때 Vercel이 자체 404를 반환한다(2026-08-18 실제 발생, 원인
  파악에 시간 걸림 — 재발 시 이 항목부터 의심할 것).
- **DB(Neon)**: 연결 완료. 재료 10개 + 레시피 10개 시드됨. 비밀번호를 바꾸면(재발급)
  Render `DATABASE_URL`도 즉시 같이 갱신해야 한다(안 그러면 스키마는 그대로인데
  인증만 깨짐).
