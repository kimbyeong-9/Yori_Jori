import { useState } from 'react'
import { useSession } from '../../../context/SessionContext'
import { trackEvent } from '../../analytics/track'
import { createIngredient } from '../../ingredient/api'
import { useIngredientSearch } from '../../ingredient/useIngredientSearch'
import type { Ingredient } from '../../ingredient/types'
import { FRESHNESS_LABELS, getApiErrorMessage, type FreshnessStatus } from '../../../types/common'
import { createFridgeItem } from '../api'

// IngredientAddPage와 동일하게 신규 등록 시엔 fresh/near_expiry만 고른다(이미 기한이
// 지난 재료를 신규 등록하는 시나리오는 다루지 않는다).
const ADD_FRESHNESS_OPTIONS: FreshnessStatus[] = ['fresh', 'near_expiry']

interface AddFridgeItemModalProps {
  onClose: () => void
  onAdded: () => void
}

export function AddFridgeItemModal({ onClose, onAdded }: AddFridgeItemModalProps) {
  const { sessionId } = useSession()
  const { query, setQuery, results, isLoading, error: searchError } = useIngredientSearch()

  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)
  const [wasFreeRegistered, setWasFreeRegistered] = useState(false)
  const [freshness, setFreshness] = useState<FreshnessStatus>('fresh')
  const [foodExpiresAt, setFoodExpiresAt] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelect = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient)
    setWasFreeRegistered(false)
    setError(null)
  }

  const handleRegisterNew = async () => {
    const trimmed = query.trim()
    if (!trimmed) return
    setIsRegistering(true)
    setError(null)
    try {
      const ingredient = await createIngredient(trimmed)
      setSelectedIngredient(ingredient)
      setWasFreeRegistered(true)
    } catch (err) {
      setError(getApiErrorMessage(err, '재료를 등록하지 못했습니다.'))
    } finally {
      setIsRegistering(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedIngredient || !sessionId) return
    setIsSubmitting(true)
    setError(null)
    try {
      await createFridgeItem({
        session_id: sessionId,
        ingredient_id: selectedIngredient.id,
        input_method: wasFreeRegistered ? 'direct' : 'search',
        freshness_status: freshness,
        food_expires_at: foodExpiresAt ? new Date(foodExpiresAt).toISOString() : undefined,
      })
      void trackEvent(sessionId, 'ingredient_added', {
        metadata: { ingredient_id: selectedIngredient.id, freshness },
      })
      onAdded()
      onClose()
    } catch (err) {
      setError(getApiErrorMessage(err, '재료를 등록하지 못했습니다.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const showRegisterFallback =
    !selectedIngredient && !isLoading && !searchError && query.trim() !== '' && results.length === 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 px-4 pb-6 backdrop-blur-sm sm:items-center sm:pb-10"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-md flex-col rounded-t-3xl bg-white shadow-xl sm:rounded-3xl"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-center pt-4 pb-2">
          <div className="h-1.5 w-10 rounded-full bg-brand-text/15" />
        </div>

        <div className="flex flex-col gap-5 px-6 pb-8 pt-2">
          <h2 className="text-center text-lg font-bold text-brand-text">식재료 추가</h2>

          {!selectedIngredient ? (
            <div className="flex flex-col gap-2">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="재료 이름을 입력하세요 (예: 양파)"
                autoFocus
                className="w-full rounded-full bg-brand-text/5 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
              {isLoading && <p className="px-1 text-xs text-brand-text/50">검색 중...</p>}
              {searchError && <p className="px-1 text-xs text-brand-primary">{searchError}</p>}
              {results.length > 0 && (
                <ul className="flex flex-col gap-1 rounded-xl border border-brand-text/10 p-1">
                  {results.map((ingredient) => (
                    <li key={ingredient.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(ingredient)}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-brand-secondary/20"
                      >
                        <span>{ingredient.name}</span>
                        <span className="text-xs text-brand-text/50">{ingredient.category}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {showRegisterFallback && (
                <button
                  type="button"
                  onClick={handleRegisterNew}
                  disabled={isRegistering}
                  className="mt-1 flex items-center justify-center gap-2 rounded-xl border border-dashed border-brand-primary/40 px-4 py-3 text-sm font-medium text-brand-primary disabled:opacity-50"
                >
                  {isRegistering ? '등록 확인 중...' : `'${query.trim()}' 새 재료로 등록`}
                </button>
              )}
              {error && <p className="px-1 text-xs text-brand-primary">{error}</p>}
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-brand-text-sub">
                  선택한 재료
                </p>
                <div className="flex items-center justify-between rounded-xl bg-brand-text/5 px-4 py-2.5">
                  <span className="font-medium text-brand-text">{selectedIngredient.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-brand-text/50">{selectedIngredient.category}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedIngredient(null)}
                      className="text-xs text-brand-text-sub hover:text-brand-primary"
                    >
                      변경
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-brand-text-sub">
                  신선도
                </p>
                <div className="flex gap-2">
                  {ADD_FRESHNESS_OPTIONS.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setFreshness(status)
                        void trackEvent(sessionId, 'freshness_selected', {
                          metadata: { ingredient_id: selectedIngredient.id, freshness: status },
                        })
                      }}
                      className={`flex-1 rounded-full py-2.5 text-sm font-medium transition-colors ${
                        freshness === status
                          ? 'bg-brand-primary text-white'
                          : 'bg-brand-text/5 text-brand-text'
                      }`}
                    >
                      {FRESHNESS_LABELS[status]}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-medium uppercase tracking-wide text-brand-text-sub">
                  실제 소비기한 (선택)
                </span>
                <input
                  type="date"
                  value={foodExpiresAt}
                  onChange={(event) => setFoodExpiresAt(event.target.value)}
                  className="rounded-full bg-brand-text/5 px-4 py-2.5 text-sm outline-none"
                />
              </label>

              {error && <p className="text-sm text-brand-primary">{error}</p>}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !sessionId}
                className="mt-1 rounded-2xl bg-brand-primary py-3.5 text-sm font-bold text-white transition-opacity disabled:opacity-50"
              >
                {isSubmitting ? '등록 중...' : '냉장고에 등록'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
