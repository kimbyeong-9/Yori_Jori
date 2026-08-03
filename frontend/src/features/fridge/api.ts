import { apiClient } from '../../lib/apiClient'
import type { CreateFridgeItemInput, FridgeItem, UpdateFridgeItemInput } from './types'

export async function listFridgeItems(sessionId: string): Promise<FridgeItem[]> {
  const { data } = await apiClient.get<FridgeItem[]>('/fridge-items', {
    params: { session_id: sessionId },
  })
  return data
}

export async function createFridgeItem(input: CreateFridgeItemInput): Promise<FridgeItem> {
  const { data } = await apiClient.post<FridgeItem>('/fridge-items', input)
  return data
}

export async function updateFridgeItem(
  sessionId: string,
  fridgeItemId: string,
  input: UpdateFridgeItemInput,
): Promise<FridgeItem> {
  const { data } = await apiClient.patch<FridgeItem>(`/fridge-items/${fridgeItemId}`, input, {
    params: { session_id: sessionId },
  })
  return data
}

export async function deleteFridgeItem(sessionId: string, fridgeItemId: string): Promise<void> {
  await apiClient.delete(`/fridge-items/${fridgeItemId}`, { params: { session_id: sessionId } })
}
