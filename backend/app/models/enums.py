from enum import Enum


class FreshnessStatus(str, Enum):
    FRESH = "fresh"
    NEAR_EXPIRY = "near_expiry"
    EXPIRED = "expired"
