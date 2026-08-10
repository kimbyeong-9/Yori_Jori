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
    return (
      <div className="w-full rounded-2xl border border-brand-text/10 bg-brand-text/5 p-4">
        <p className="py-3 text-center text-xs text-brand-text-sub">등록된 재료 정보가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="w-full rounded-2xl border border-brand-text/10 bg-brand-text/5 p-4">
      <ul className="flex flex-col">
        {ingredients.map((item, index) => {
          const owned = ownedIngredientIds.has(item.ingredient.id)
          return (
            <li
              key={item.ingredient.id}
              className={`flex items-center justify-between py-2.5 ${
                index !== ingredients.length - 1 ? 'border-b border-brand-text/10' : ''
              } ${index === 0 ? 'pt-0' : ''} ${index === ingredients.length - 1 ? 'pb-0' : ''}`}
            >
              <span className="text-sm text-brand-text">
                {item.ingredient.name}
                {item.is_optional && <span className="ml-1 text-xs text-brand-text-sub">(선택)</span>}
              </span>
              <span className="flex items-center gap-2">
                {item.quantity && (
                  <span className="text-sm font-semibold text-brand-primary">{item.quantity}</span>
                )}
                <Badge tone={owned ? 'secondary' : 'primary'}>{owned ? '보유' : '부족'}</Badge>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
