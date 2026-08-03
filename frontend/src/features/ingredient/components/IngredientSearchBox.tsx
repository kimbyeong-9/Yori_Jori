import { Badge } from '../../../components/Badge'
import { useIngredientSearch } from '../useIngredientSearch'
import type { Ingredient } from '../types'

interface IngredientSearchBoxProps {
  onSelect: (ingredient: Ingredient) => void
  placeholder?: string
  initialQuery?: string
}

export function IngredientSearchBox({
  onSelect,
  placeholder,
  initialQuery,
}: IngredientSearchBoxProps) {
  const { query, setQuery, results, isLoading, error } = useIngredientSearch(initialQuery)

  return (
    <div className="flex flex-col gap-2">
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder ?? '식재료를 검색하세요 (예: 계란)'}
        className="w-full rounded-xl border border-brand-text/20 bg-white px-4 py-2 text-sm focus:border-brand-primary focus:outline-none"
      />
      {isLoading && <p className="text-xs text-brand-text/50">검색 중...</p>}
      {error && <p className="text-xs text-brand-primary">{error}</p>}
      {results.length > 0 && (
        <ul className="flex flex-col gap-1 rounded-xl border border-brand-text/10 bg-white p-1">
          {results.map((ingredient) => (
            <li key={ingredient.id}>
              <button
                type="button"
                onClick={() => onSelect(ingredient)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-brand-secondary/20"
              >
                <span>{ingredient.name}</span>
                <Badge tone="secondary">{ingredient.category}</Badge>
              </button>
            </li>
          ))}
        </ul>
      )}
      {!isLoading && query.trim() !== '' && results.length === 0 && !error && (
        <p className="text-xs text-brand-text/50">검색 결과가 없습니다.</p>
      )}
    </div>
  )
}
