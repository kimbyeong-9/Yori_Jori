from sqlmodel import Session

from app.db.session import engine
from app.seed.seed_ingredients import seed_top_ingredients
from app.seed.seed_recipes import seed_test_recipe


def main() -> None:
    with Session(engine) as session:
        ingredients = seed_top_ingredients(session)
        print(f"seeded/verified {len(ingredients)} top ingredients")
        recipe = seed_test_recipe(session)
        print(f"seeded/verified recipe: {recipe.title}")


if __name__ == "__main__":
    main()
