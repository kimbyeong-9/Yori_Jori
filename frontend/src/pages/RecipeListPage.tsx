import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Badge } from '../components/Badge'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { Spinner } from '../components/Spinner'
import { useSession } from '../context/SessionContext'
import { trackEvent } from '../features/analytics/track'
import { createRecommendation } from '../features/recommendation/api'
import { RecipeResultCard } from '../features/recommendation/components/RecipeResultCard'
import type { RecommendationResponse } from '../features/recommendation/types'
import { getApiErrorMessage } from '../types/common'

export function RecipeListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { sessionId } = useSession()
  const fridgeItemIdsParam = searchParams.get('fridge_item_ids') ?? ''
  const fridgeItemIds = fridgeItemIdsParam.split(',').filter(Boolean)

  // BL-13: 홈페이지의 자유 재료명 검색(POST /recipes/search) 결과는 fridge_item_ids
  // 쿼리 파라미터 없이 router state로 곧장 넘어온다 — 있으면 그 결과를 그대로 쓴다.
  const searchResult =
    (location.state as { searchResult?: RecommendationResponse } | null)?.searchResult ?? null

  const [result, setResult] = useState<RecommendationResponse | null>(searchResult)
  const [isLoading, setIsLoading] = useState(!searchResult)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (searchResult) return
    const ids = fridgeItemIdsParam.split(',').filter(Boolean)
    if (!sessionId || ids.length === 0) {
      setIsLoading(false)
      return
    }
    let cancelled = false
    setIsLoading(true)
    createRecommendation(sessionId, ids)
      .then((data) => {
        if (!cancelled) {
          setResult(data)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, '추천을 불러오지 못했습니다.'))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [sessionId, fridgeItemIdsParam, searchResult])

  useEffect(() => {
    if (!result) return
    void trackEvent(sessionId, 'recommendation_impression', {
      metadata: {
        request_id: result.recommendation_id,
        recipe_ids: result.recipes.map((recipe) => recipe.id),
      },
    })
  }, [result, sessionId])

  const handleClickRecipe = (recipeId: string, position: number) => {
    void trackEvent(sessionId, 'recipe_click', { recipeId, metadata: { position } })
    navigate(`/recipes/${recipeId}`)
  }

  if (!searchResult && fridgeItemIds.length === 0) {
    return (
      <EmptyState
        title="선택된 재료가 없어요"
        description="냉장고에서 재료를 선택하고 추천을 요청해주세요."
      />
    )
  }

  if (isLoading) return <Spinner label="레시피를 추천받는 중..." />
  if (error) return <ErrorState message={error} />
  if (!result) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">추천 레시피</h1>
        <Badge tone={result.source === 'db' ? 'secondary' : 'accent'}>
          {result.source === 'db' ? 'DB 매칭' : 'AI 생성'}
          {result.cached ? ' · 캐시' : ''}
        </Badge>
      </div>

      {result.recipes.length === 0 ? (
        <EmptyState
          title="추천 가능한 레시피가 없어요"
          description="다른 재료를 선택하거나 재료를 더 등록해보세요."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {result.recipes.map((recipe, index) => (
            <RecipeResultCard
              key={recipe.id}
              recipe={recipe}
              onClick={() => handleClickRecipe(recipe.id, index + 1)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
