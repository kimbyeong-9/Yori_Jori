import { apiClient } from '../../lib/apiClient'
import type { Ingredient } from './types'

export interface ListIngredientsParams {
  query?: string
  category?: string
  top?: boolean
}

export async function listIngredients(params: ListIngredientsParams = {}): Promise<Ingredient[]> {
  const { data } = await apiClient.get<Ingredient[]>('/ingredients', { params })
  return data
}
