import { Badge } from '../../../components/Badge'
import type { RecipeIngredient } from '../types'

interface RecipeIngredientListProps {
  ingredients: RecipeIngredient[]
  ownedIngredientIds: Set<string>
}

export function RecipeIngredientList({
  ingredients,
  ownedIngredientIds,
}: RecipeIngredientListProps) {
  if (ingredients.length === 0) {
    return <p className="text-sm text-brand-text/50">등록된 재료 정보가 없습니다.</p>
  }

  return (
    <ul className="flex flex-col gap-1">
      {ingredients.map((item) => {
        const owned = ownedIngredientIds.has(item.ingredient.id)
        return (
          <li
            key={item.ingredient.id}
            className="flex items-center justify-between border-b border-brand-text/5 py-1.5 text-sm last:border-none"
          >
            <span>
              {item.ingredient.name}
              {item.is_optional && <span className="text-brand-text/40"> (선택)</span>}
            </span>
            <span className="flex items-center gap-2">
              {item.quantity && (
                <span className="text-brand-text/60">{item.quantity}</span>
              )}
              <Badge tone={owned ? 'secondary' : 'primary'}>{owned ? '보유' : '부족'}</Badge>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
