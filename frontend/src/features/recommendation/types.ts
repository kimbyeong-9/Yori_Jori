// docs/api-contract.md §8 POST /recommendations
export interface RecommendedRecipe {
  id: string
  title: string
  cooking_time_min: number
  instructions: string
  matched_ingredients: string[]
  missing_ingredients: string[]
  safety_note: string | null
  match_score: number
}

export type RecommendationSource = 'db' | 'gemini'

export interface RecommendationResponse {
  recommendation_id: string
  source: RecommendationSource
  cached: boolean
  recipes: RecommendedRecipe[]
}
