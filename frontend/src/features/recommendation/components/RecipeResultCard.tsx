import type { KeyboardEvent } from 'react'
import { Badge } from '../../../components/Badge'
import { Card } from '../../../components/Card'
import type { RecommendedRecipe } from '../types'

export function RecipeResultCard({
  recipe,
  onClick,
}: {
  recipe: RecommendedRecipe
  onClick: () => void
}) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick()
    }
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className="flex cursor-pointer flex-col gap-2 hover:border-brand-primary"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium">{recipe.title}</h3>
        <Badge tone="neutral">{recipe.cooking_time_min}분</Badge>
      </div>
      {recipe.matched_ingredients.length > 0 && (
        <p className="text-xs text-brand-text/70">
          보유 재료: {recipe.matched_ingredients.join(', ')}
        </p>
      )}
      {recipe.missing_ingredients.length > 0 && (
        <p className="text-xs text-brand-primary">
          부족한 재료: {recipe.missing_ingredients.join(', ')}
        </p>
      )}
    </Card>
  )
}
