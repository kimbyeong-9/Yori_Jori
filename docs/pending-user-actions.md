# 사용자가 직접 처리해야 할 항목

- 작성일: 2026-08-05 (git 저장소/원격이 이미 설정돼 있음을 확인해 관련 항목 제거)
- 용도: AI가 임의로 정하거나 임시로 둔 것 중, 사용자의 직접 조치·결정이 필요한 항목을
  모아둔다. 새 단계를 진행하면서 항목이 늘거나 해소되면 이 문서를 갱신한다(체크 표시 또는
  삭제).
- 관련 문서: [decision-log.md](./decision-log.md)(제품/아키텍처 결정 전체 이력),
  [backlog.md](./backlog.md)(백로그별 선행 조건)

## 반드시 사용자가 해야 하는 것

- [ ] **`GEMINI_API_KEY` 발급 및 설정**
  지금 `.env`에 키가 없어 `/recommendations`는 항상 Gemini 호출이 실패하고 DB 폴백만
  동작한다(에러는 안 나지만 실제 추천 품질은 검증 못 한 상태). Google AI Studio 등에서
  키를 받아 `backend/.env`(git에 안 올라가는 실제 파일, `.env.example` 복사해서 생성)에
  `GEMINI_API_KEY=...`를 넣는다. `GEMINI_MODEL`은 기본값(`gemini-2.0-flash`)이 있어
  안 바꿔도 된다.

- [ ] **실제 키로 한 번 수동 테스트 (권장)**
  Gemini 관련 테스트는 전부 mock(`httpx.MockTransport`)으로만 검증했다. 실제 키를 넣은
  뒤 서버를 띄우고 `/recommendations`를 한 번 직접 호출해, Gemini가 실제로 지정한 JSON
  스키마대로 응답하는지 확인한다(mock으로 만든 가정이 실제 API 동작과 안 맞을 가능성).

## 제품 결정이 필요한 것 (Open Decision — decision-log.md)

- [ ] **DL-006 — 재료 마스터 데이터의 실제 출처**
  지금은 Top 10을 코드(`backend/app/seed/seed_ingredients.py`)에 하드코딩해서 시드한다.
  실제 서비스에 쓸 재료 목록(엑셀 등)을 주면 그걸로 교체한다.

- [ ] **DL-007 — 마스터에 없는 재료의 자유 등록 허용 여부**
  사용자가 검색해도 없는 재료를 직접 입력하게 할지, 마스터 목록 안에서만 고르게 할지 아직
  안 정했다. `POST /api/v1/ingredients` 구현 여부와 직결된다.

- [ ] **DL-012 — 추천 DB 매칭 임계값/가중치 (급하지 않음)**
  "매칭률 50% 이상 레시피 3개면 DB로 충분", "임박 재료당 +0.15 가중치"는 임시값
  (`backend/app/services/recommendation_service.py`,
  `backend/app/services/recommendation_matching.py`). 지금은 레시피가 1건뿐이라 사실상
  항상 Gemini로 넘어가니 당장 문제는 아니지만, 레시피가 쌓이면 실사용 데이터로 조정 필요.

## 환경 관련

- [ ] **`backend/.env` 직접 생성**
  `cp .env.example .env` 후 본인 로컬 DB/키로 채워야 실제로 서버가 뜬다(테스트 시에는
  매번 임시 Docker 컨테이너 + 환경변수로만 했고, 실제 `.env` 파일은 만들지 않았다).

## 아직 시작 안 한 것 (참고)

- `POST /api/v1/ingredients`(재료 자유 등록) — DL-007 결정 이후 진행
- 배포/인프라(호스팅, CI/CD) — Non-Goal로 명시, 착수 안 함
