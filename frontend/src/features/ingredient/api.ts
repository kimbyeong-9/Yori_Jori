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

// docs/api-contract.md §2 POST /ingredients. 이미 있는 이름이면 200 + 기존 재료,
// 신규면 Gemini 검증을 거쳐 201 + 새 재료를 반환한다(둘 다 응답 형태는 Ingredient로 동일).
export async function createIngredient(name: string): Promise<Ingredient> {
  const { data } = await apiClient.post<Ingredient>('/ingredients', { name })
  return data
}
