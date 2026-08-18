from sqlmodel import Session

from app.db.session import engine
from app.seed.seed_ingredients import seed_top_ingredients
from app.seed.seed_recipes import seed_recipes


def main() -> None:
    with Session(engine) as session:
        ingredients = seed_top_ingredients(session)
        print(f"seeded/verified {len(ingredients)} top ingredients")
        recipes = seed_recipes(session)
        print(f"seeded/verified {len(recipes)} recipes")


if __name__ == "__main__":
    main()
