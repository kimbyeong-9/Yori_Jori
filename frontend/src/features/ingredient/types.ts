// docs/api-contract.md §2 IngredientRead
export interface Ingredient {
  id: string
  name: string
  category: string
  unit: string
  is_top: boolean
}
