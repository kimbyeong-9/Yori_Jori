import type { RecipeSummary } from '../recipe/types'

// docs/api-contract.md §5 SavedRecipeListItem
export interface SavedRecipe {
  id: string
  recipe: RecipeSummary
  created_at: string
}
