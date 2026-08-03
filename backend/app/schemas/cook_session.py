import uuid
from datetime import datetime

from sqlmodel import SQLModel


class CookSessionCreate(SQLModel):
    session_id: uuid.UUID


class CookSessionStartResponse(SQLModel):
    cook_session_id: uuid.UUID
    started_at: datetime


class CookSessionCompleteResponse(SQLModel):
    completed_at: datetime
