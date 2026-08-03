import uuid

from sqlmodel import Field, SQLModel

from app.models.base import uuid_pk_field


class RecipeIngredient(SQLModel, table=True):
    __tablename__ = "recipe_ingredients"

    id: uuid.UUID = uuid_pk_field()
    recipe_id: uuid.UUID = Field(foreign_key="recipes.id", index=True)
    ingredient_id: uuid.UUID = Field(foreign_key="ingredients.id", index=True)
    quantity: str
    is_optional: bool = Field(default=False)
