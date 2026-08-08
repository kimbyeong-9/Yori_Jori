from enum import Enum


class FreshnessStatus(str, Enum):
    FRESH = "fresh"
    NEAR_EXPIRY = "near_expiry"
    EXPIRED = "expired"


class RecipeDifficulty(str, Enum):
    EASY = "easy"
    NORMAL = "normal"
    HARD = "hard"
