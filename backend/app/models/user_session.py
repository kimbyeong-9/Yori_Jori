import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime
from sqlmodel import Field, SQLModel

from app.models.base import timestamp_field, uuid_pk_field

# NOTE: 클래스명은 테이블명(user_sessions)과 달리 UserSession으로 짓는다.
# `Session`은 sqlmodel.Session(DB 세션 클래스)과 이름이 충돌하기 때문이다.


class UserSession(SQLModel, table=True):
    __tablename__ = "user_sessions"

    id: uuid.UUID = uuid_pk_field()
    anonymous_user_id: uuid.UUID = Field(foreign_key="anonymous_users.id", index=True)
    created_at: datetime = timestamp_field()
    # 만료 기간 정책은 아직 미정(docs/decision-log.md DL-003, Open)이므로 기본값을
    # 코드에 하드코딩하지 않는다. 세션을 생성하는 쪽에서 항상 명시적으로 값을 채운다.
    expires_at: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False))
