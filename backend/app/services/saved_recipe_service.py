import uuid

from sqlmodel import Session

from app.core.errors import ConflictError, ForbiddenError, NotFoundError
from app.models.recipe import Recipe
from app.models.saved_recipe import SavedRecipe
from app.repositories import recipe_repo, saved_recipe_repo, user_session_repo


def list_saved_recipes(
    db: Session, session_id: uuid.UUID
) -> list[tuple[SavedRecipe, Recipe]]:
    if user_session_repo.get(db, session_id) is None:
        raise NotFoundError("세션을 찾을 수 없습니다.")
    saved_list = saved_recipe_repo.list_by_session(db, session_id)
    recipes = {r.id: r for r in recipe_repo.get_many(db, {s.recipe_id for s in saved_list})}
    return [(saved, recipes[saved.recipe_id]) for saved in saved_list]


def create_saved_recipe(db: Session, session_id: uuid.UUID, recipe_id: uuid.UUID) -> SavedRecipe:
    if user_session_repo.get(db, session_id) is None:
        raise NotFoundError("세션을 찾을 수 없습니다.")
    if recipe_repo.get(db, recipe_id) is None:
        raise NotFoundError("레시피를 찾을 수 없습니다.")
    if saved_recipe_repo.get_by_session_and_recipe(db, session_id, recipe_id) is not None:
        raise ConflictError("이미 저장된 레시피입니다.")

    saved = SavedRecipe(session_id=session_id, recipe_id=recipe_id)
    saved_recipe_repo.create(db, saved)
    db.commit()
    return saved


def delete_saved_recipe(db: Session, session_id: uuid.UUID, recipe_id: uuid.UUID) -> None:
    saved = saved_recipe_repo.get_by_session_and_recipe(db, session_id, recipe_id)
    if saved is not None:
        saved_recipe_repo.delete(db, saved)
        db.commit()
        return

    # session_id/recipe_id 조합으로는 못 찾았다 — recipe_id 자체가 다른 세션에
    # 저장돼 있는지 확인해 403(다른 세션 소유)과 404(아예 저장 안 됨)를 구분한다.
    if saved_recipe_repo.get_any_by_recipe(db, recipe_id) is not None:
        raise ForbiddenError("다른 세션이 저장한 레시피입니다.")
    raise NotFoundError("저장된 레시피를 찾을 수 없습니다.")
