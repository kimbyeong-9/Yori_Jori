import { useEffect, useState } from 'react'
import { Spinner } from '../../../components/Spinner'
import { ErrorState } from '../../../components/ErrorState'
import { EmptyState } from '../../../components/EmptyState'
import { listIngredients } from '../api'
import type { Ingredient } from '../types'

export function TopIngredientList({ onSelect }: { onSelect: (ingredient: Ingredient) => void }) {
  const [items, setItems] = useState<Ingredient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    listIngredients({ top: true })
      .then((data) => {
        if (!cancelled) setItems(data)
      })
      .catch(() => {
        if (!cancelled) setError('인기 재료를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (isLoading) return <Spinner label="인기 재료 불러오는 중..." />
  if (error) return <ErrorState message={error} />
  if (items.length === 0) {
    return <EmptyState title="등록된 인기 재료가 없습니다." />
  }

  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {items.map((ingredient) => (
        <li key={ingredient.id}>
          <button
            type="button"
            onClick={() => onSelect(ingredient)}
            className="w-full rounded-xl border border-brand-text/10 bg-white px-3 py-3 text-sm hover:border-brand-primary"
          >
            {ingredient.name}
          </button>
        </li>
      ))}
    </ul>
  )
}
