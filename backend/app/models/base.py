import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import Column, DateTime
from sqlmodel import Field


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def uuid_pk_field() -> Any:
    return Field(default_factory=uuid.uuid4, primary_key=True)


def timestamp_field(
    *, nullable: bool = False, onupdate: bool = False, index: bool = False
) -> Any:
    column = Column(
        DateTime(timezone=True),
        nullable=nullable,
        onupdate=utc_now if onupdate else None,
        index=index,
    )
    return Field(default_factory=utc_now, sa_column=column)
