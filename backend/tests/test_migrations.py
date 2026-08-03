from sqlalchemy import inspect

EXPECTED_TABLES = {
    "anonymous_users",
    "user_sessions",
    "ingredients",
    "fridge_items",
    "recipes",
    "recipe_ingredients",
    "recommendation_requests",
    "recommendation_request_items",
    "saved_recipes",
    "interaction_logs",
    "llm_cache",
}


def test_migration_creates_all_expected_tables(migrated_engine):
    inspector = inspect(migrated_engine)
    table_names = set(inspector.get_table_names())
    assert EXPECTED_TABLES.issubset(table_names)


def test_saved_recipes_has_unique_constraint(migrated_engine):
    inspector = inspect(migrated_engine)
    unique_constraints = inspector.get_unique_constraints("saved_recipes")
    assert any(
        set(uc["column_names"]) == {"session_id", "recipe_id"} for uc in unique_constraints
    )
