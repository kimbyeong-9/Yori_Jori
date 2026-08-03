from datetime import datetime, timedelta, timezone

from app.models.enums import FreshnessStatus
from app.services.freshness import compute_action_due_at

CREATED_AT = datetime(2026, 7, 31, 12, 0, tzinfo=timezone.utc)


def test_fresh_action_due_at_is_48_hours_after_created_at():
    result = compute_action_due_at(FreshnessStatus.FRESH, CREATED_AT)
    assert result == CREATED_AT + timedelta(hours=48)


def test_near_expiry_action_due_at_is_24_hours_after_created_at():
    result = compute_action_due_at(FreshnessStatus.NEAR_EXPIRY, CREATED_AT)
    assert result == CREATED_AT + timedelta(hours=24)


def test_expired_has_no_action_due_at():
    assert compute_action_due_at(FreshnessStatus.EXPIRED, CREATED_AT) is None


def test_fridge_item_model_auto_fills_action_due_at():
    from app.models.fridge_item import FridgeItem

    item = FridgeItem(
        session_id="00000000-0000-0000-0000-000000000001",
        ingredient_id="00000000-0000-0000-0000-000000000002",
        input_method="search",
        freshness_status=FreshnessStatus.FRESH,
        created_at=CREATED_AT,
    )
    assert item.action_due_at == CREATED_AT + timedelta(hours=48)
