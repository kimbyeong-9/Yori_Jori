from sqlmodel import Session

from app.models.interaction_log import InteractionLog


def create(db: Session, log: InteractionLog) -> InteractionLog:
    db.add(log)
    db.flush()
    return log
