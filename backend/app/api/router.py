from fastapi import APIRouter

from app.api import (
    cook_sessions,
    events,
    fridge_items,
    ingredients,
    recipes,
    recommendations,
    saved_recipes,
    sessions,
)

api_router = APIRouter()
api_router.include_router(sessions.router)
api_router.include_router(ingredients.router)
api_router.include_router(fridge_items.router)
api_router.include_router(recipes.router)
api_router.include_router(saved_recipes.router)
api_router.include_router(events.router)
api_router.include_router(recommendations.router)
api_router.include_router(cook_sessions.router)
