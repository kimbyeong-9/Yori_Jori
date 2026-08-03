import { apiClient } from '../../lib/apiClient'
import type { SavedRecipe } from './types'

export async function listSavedRecipes(sessionId: string): Promise<SavedRecipe[]> {
  const { data } = await apiClient.get<SavedRecipe[]>('/saved-recipes', {
    params: { session_id: sessionId },
  })
  return data
}

export async function saveRecipe(sessionId: string, recipeId: string): Promise<void> {
  await apiClient.post('/saved-recipes', { session_id: sessionId, recipe_id: recipeId })
}

export async function unsaveRecipe(sessionId: string, recipeId: string): Promise<void> {
  await apiClient.delete(`/saved-recipes/${recipeId}`, { params: { session_id: sessionId } })
}
