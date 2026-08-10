import type { KeyboardEvent } from 'react'
import { Badge } from '../../../components/Badge'
import { Card } from '../../../components/Card'
import { ClockIcon } from '../../../components/icons'
import type { RecommendedRecipe } from '../types'

// 카드 제목에는 괄호로 덧붙은 부연 설명(예: "계란볶음밥 (초간단)")을 빼고 보여준다.
function stripParenthetical(title: string): string {
  return title.replace(/\s*\(.*?\)\s*/g, '')
}

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
      className="flex cursor-pointer flex-col items-start gap-3 p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <h3 className="min-h-[2.5rem] text-[15px] font-semibold leading-snug text-brand-text line-clamp-2">
        {stripParenthetical(recipe.title)}
      </h3>

      <div className="flex w-full items-center justify-between border-t border-brand-text/10 pt-3">
        <span className="flex items-center gap-1.5 text-xs text-brand-text-sub">
          <ClockIcon className="h-3.5 w-3.5" />
          {recipe.cooking_time_min}분
        </span>
        {recipe.difficulty && <Badge tone="neutral">{recipe.difficulty.toUpperCase()}</Badge>}
      </div>

      {(recipe.matched_ingredients.length > 0 || recipe.missing_ingredients.length > 0) && (
        <div className="flex flex-col gap-1 text-xs">
          {recipe.matched_ingredients.length > 0 && (
            <p className="text-brand-text/70">보유 재료: {recipe.matched_ingredients.join(', ')}</p>
          )}
          {recipe.missing_ingredients.length > 0 && (
            <p className="text-brand-primary">부족한 재료: {recipe.missing_ingredients.join(', ')}</p>
          )}
        </div>
      )}
    </Card>
  )
}
