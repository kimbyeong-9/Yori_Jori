import uuid
from unittest.mock import patch

from app.repositories import anonymous_user_repo
from app.services import session_service


def test_get_or_create_session_recovers_from_concurrent_insert_race(session):
    """browser_uuid가 같은 두 요청이 거의 동시에 들어오면(예: React StrictMode의
    effect 이중 호출, 여러 탭 동시 로드) 둘 다 '없음'을 보고 INSERT를 시도해 unique
    제약 위반이 날 수 있다. 이 테스트는 그 경쟁 상황을 재현해 500 대신 정상 응답으로
    복구되는지 확인한다.
    """
    browser_uuid = uuid.uuid4()
    # "다른 요청"이 이미 커밋해둔 것처럼 미리 만들어둔다.
    anonymous_user_repo.create(session, browser_uuid, "existing-agent")
    session.commit()

    original_get = anonymous_user_repo.get_by_browser_uuid
    call_count = {"n": 0}

    def flaky_get(db, bu):
        call_count["n"] += 1
        if call_count["n"] == 1:
            # 이 요청의 최초 조회 시점에는 아직 못 찾은 것처럼 경쟁 상황을 흉내낸다.
            return None
        return original_get(db, bu)

    with patch.object(anonymous_user_repo, "get_by_browser_uuid", side_effect=flaky_get):
        user, user_session = session_service.get_or_create_session(
            session, browser_uuid, "new-agent"
        )

    assert user.browser_uuid == browser_uuid
    assert user_session.anonymous_user_id == user.id
