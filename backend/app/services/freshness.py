from datetime import datetime, timedelta

from app.models.enums import FreshnessStatus

_ACTION_WINDOW = {
    FreshnessStatus.FRESH: timedelta(hours=48),
    FreshnessStatus.NEAR_EXPIRY: timedelta(hours=24),
}


def compute_action_due_at(
    freshness_status: FreshnessStatus, created_at: datetime
) -> datetime | None:
    window = _ACTION_WINDOW.get(freshness_status)
    if window is None:
        return None
    return created_at + window
