import { apiClient } from '../../lib/apiClient'
import type { RecommendationResponse } from './types'

export async function createRecommendation(
  sessionId: string,
  fridgeItemIds: string[],
): Promise<RecommendationResponse> {
  const { data } = await apiClient.post<RecommendationResponse>('/recommendations', {
    session_id: sessionId,
    fridge_item_ids: fridgeItemIds,
  })
  return data
}

export async function searchRecipesByNames(
  sessionId: string,
  ingredientNames: string[],
): Promise<RecommendationResponse> {
  const { data } = await apiClient.post<RecommendationResponse>('/recipes/search', {
    session_id: sessionId,
    ingredient_names: ingredientNames,
  })
  return data
}
