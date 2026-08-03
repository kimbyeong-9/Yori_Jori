import { apiClient } from '../../lib/apiClient'
import type { CookSessionComplete, CookSessionStart, RecipeDetail, RecipeSummary } from './types'

export async function getRecipe(recipeId: string): Promise<RecipeDetail> {
  const { data } = await apiClient.get<RecipeDetail>(`/recipes/${recipeId}`)
  return data
}

export async function getRecentRecipes(sessionId: string): Promise<RecipeSummary[]> {
  const { data } = await apiClient.get<RecipeSummary[]>('/recipes/recent', {
    params: { session_id: sessionId },
  })
  return data
}

export async function startCookSession(
  sessionId: string,
  recipeId: string,
): Promise<CookSessionStart> {
  const { data } = await apiClient.post<CookSessionStart>(`/recipes/${recipeId}/cook-sessions`, {
    session_id: sessionId,
  })
  return data
}

export async function completeCookSession(
  sessionId: string,
  cookSessionId: string,
): Promise<CookSessionComplete> {
  const { data } = await apiClient.patch<CookSessionComplete>(
    `/cook-sessions/${cookSessionId}/complete`,
    undefined,
    { params: { session_id: sessionId } },
  )
  return data
}
