import type { RecipeDifficulty } from '../../types/common'

// docs/api-contract.md §8 POST /recommendations, §9 POST /recipes/search
export interface RecommendedRecipe {
  id: string
  title: string
  cooking_time_min: number
  instructions: string
  matched_ingredients: string[]
  missing_ingredients: string[]
  safety_note: string | null
  match_score: number
  description: string | null
  servings: number | null
  difficulty: RecipeDifficulty | null
  tip: string | null
}

export type RecommendationSource = 'db' | 'gemini'

export interface RecommendationResponse {
  recommendation_id: string
  source: RecommendationSource
  cached: boolean
  recipes: RecommendedRecipe[]
}
