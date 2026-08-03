import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { useSession } from '../context/SessionContext'
import { trackEvent } from '../features/analytics/track'
import { createFridgeItem } from '../features/fridge/api'
import { IngredientSearchBox } from '../features/ingredient/components/IngredientSearchBox'
import type { Ingredient } from '../features/ingredient/types'
import { FRESHNESS_LABELS, getApiErrorMessage, type FreshnessStatus } from '../types/common'

// 이 화면에서는 fresh/near_expiry만 선택하게 한다(지시사항에 명시된 값). 이미 기한이
// 지난(expired) 재료를 신규 등록하는 시나리오는 다루지 않는다 — expired는 FridgePage의
// 수정 화면에서만 선택할 수 있다.
const ADD_FRESHNESS_OPTIONS: FreshnessStatus[] = ['fresh', 'near_expiry']

export function IngredientAddPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { sessionId } = useSession()

  const stateIngredient =
    (location.state as { ingredient?: Ingredient } | null)?.ingredient ?? null

  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(stateIngredient)
  const [quantity, setQuantity] = useState('')
  const [freshness, setFreshness] = useState<FreshnessStatus>('fresh')
  const [foodExpiresAt, setFoodExpiresAt] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSelectIngredient = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient)
    setError(null)
    setSuccess(false)
  }

  const handleFreshnessChange = (status: FreshnessStatus) => {
    setFreshness(status)
    void trackEvent(sessionId, 'freshness_selected', {
      metadata: { ingredient_id: selectedIngredient?.id, freshness: status },
    })
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedIngredient || !sessionId) return
    setIsSubmitting(true)
    setError(null)
    try {
      await createFridgeItem({
        session_id: sessionId,
        ingredient_id: selectedIngredient.id,
        quantity: quantity || undefined,
        input_method: 'search',
        freshness_status: freshness,
        food_expires_at: foodExpiresAt ? new Date(foodExpiresAt).toISOString() : undefined,
      })
      void trackEvent(sessionId, 'ingredient_added', {
        metadata: { ingredient_id: selectedIngredient.id, freshness },
      })
      setSuccess(true)
      setTimeout(() => navigate('/fridge'), 600)
    } catch (err) {
      setError(getApiErrorMessage(err, '재료를 등록하지 못했습니다.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <h1 className="text-2xl font-semibold">식재료 추가</h1>

      <section>
        <p className="mb-2 text-sm font-medium">1. 식재료 검색</p>
        <IngredientSearchBox
          onSelect={handleSelectIngredient}
          initialQuery={searchParams.get('q') ?? undefined}
        />
      </section>

      {selectedIngredient && (
        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium">2. 선택한 재료</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-medium">{selectedIngredient.name}</span>
                <Badge tone="secondary">{selectedIngredient.category}</Badge>
              </div>
            </div>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">보유량</span>
              <input
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                placeholder={`예: 2${selectedIngredient.unit}`}
                className="rounded-lg border border-brand-text/20 px-3 py-2"
              />
            </label>

            <div>
              <p className="text-sm font-medium">신선도</p>
              <div className="mt-1 flex gap-2">
                {ADD_FRESHNESS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleFreshnessChange(status)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium ${
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
              <span className="font-medium">실제 소비기한 (선택)</span>
              <input
                type="date"
                value={foodExpiresAt}
                onChange={(event) => setFoodExpiresAt(event.target.value)}
                className="rounded-lg border border-brand-text/20 px-3 py-2"
              />
            </label>

            {error && <p className="text-sm text-brand-primary">{error}</p>}
            {success && <p className="text-sm text-brand-text">냉장고에 등록했어요!</p>}

            <Button type="submit" disabled={isSubmitting || !sessionId}>
              {isSubmitting ? '등록 중...' : '냉장고 등록'}
            </Button>
          </form>
        </Card>
      )}
    </div>
  )
}
