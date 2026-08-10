import type { Ingredient } from '../ingredient/types'
import type { RecipeDifficulty } from '../../types/common'

// docs/api-contract.md §4 GET /recipes/{recipe_id} (5단계에서 ingredients 추가)
export interface RecipeIngredient {
  ingredient: Ingredient
  quantity: string
  is_optional: boolean
}

export interface RecipeDetail {
  id: string
  title: string
  source: string
  source_url: string | null
  instructions: string
  cooking_time_min: number
  is_llm_generated: boolean
  created_at: string
  description: string | null
  servings: number | null
  difficulty: RecipeDifficulty | null
  tip: string | null
  ingredients: RecipeIngredient[]
}

export interface RecipeSummary {
  id: string
  title: string
  cooking_time_min: number
}
