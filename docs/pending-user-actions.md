# 사용자가 직접 처리해야 할 항목

- 작성일: 2026-08-06 (`GEMINI_API_KEY` 설정 완료 + 실제 키로 수동 검증 완료, 관련 항목 제거)
- 용도: AI가 임의로 정하거나 임시로 둔 것 중, 사용자의 직접 조치·결정이 필요한 항목을
  모아둔다. 새 단계를 진행하면서 항목이 늘거나 해소되면 이 문서를 갱신한다(체크 표시 또는
  삭제).
- 관련 문서: [decision-log.md](./decision-log.md)(제품/아키텍처 결정 전체 이력),
  [backlog.md](./backlog.md)(백로그별 선행 조건)

## 완료된 항목 (참고)

- [x] **`backend/.env` 직접 생성** 및 **`GEMINI_API_KEY` 발급/설정** — 완료.
- [x] **실제 키로 수동 테스트** — `/recommendations`를 실제로 호출해 `source: "gemini"`로
  레시피 4개가 정상 생성/캐시/영속화되는 것까지 확인(2026-08-06). 그 과정에서 찾은 문제
  2건은 코드로 고쳤다(DL-009 참조): ① 기본 타임아웃 10초가 5개 레시피 구조화 출력엔 짧아
  항상 조용히 DB로 폴백되던 문제 → 25초로 상향. ② 기본 모델 `gemini-2.0-flash`가 신규
  키에서 무료 티어 할당량 0으로 막혀 있던 문제 → `gemini-flash-latest`로 기본값 변경.

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

## 아직 시작 안 한 것 (참고)

- `POST /api/v1/ingredients`(재료 자유 등록) — DL-007 결정 이후 진행
- 배포/인프라(호스팅, CI/CD) — Non-Goal로 명시, 착수 안 함
