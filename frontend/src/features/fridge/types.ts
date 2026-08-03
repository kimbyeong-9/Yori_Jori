import type { Ingredient } from '../ingredient/types'
import type { FreshnessStatus } from '../../types/common'

// docs/api-contract.md §3 FridgeItemRead
export interface FridgeItem {
  id: string
  ingredient: Ingredient
  quantity: string | null
  input_method: string
  freshness_status: FreshnessStatus
  food_expires_at: string | null
  action_due_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateFridgeItemInput {
  session_id: string
  ingredient_id: string
  quantity?: string
  input_method: string
  freshness_status: FreshnessStatus
  food_expires_at?: string
}

export interface UpdateFridgeItemInput {
  quantity?: string
  freshness_status?: FreshnessStatus
  food_expires_at?: string | null
}
