import { apiClient } from '../../lib/apiClient'
import type { RecipeDetail, RecipeSummary } from './types'

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
