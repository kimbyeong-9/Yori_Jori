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

const CHIP_BG_CLASSES = ['bg-brand-secondary', 'bg-brand-accent']

export function RecipeListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { sessionId } = useSession()
  const fridgeItemIdsParam = searchParams.get('fridge_item_ids') ?? ''
  const fridgeItemIds = fridgeItemIdsParam.split(',').filter(Boolean)

  // BL-13: 홈페이지의 자유 재료명 검색(POST /recipes/search) 결과는 fridge_item_ids
  // 쿼리 파라미터 없이 router state로 곧장 넘어온다 — 있으면 그 결과를 그대로 쓴다.
  const locationState = location.state as
    | { searchResult?: RecommendationResponse; ingredientNames?: string[] }
    | null
  const searchResult = locationState?.searchResult ?? null
  // 선택된 식재료 칩 표시 전용 — HomePage/FridgePage가 넘겨주지 않으면(예: URL 직접
  // 접근) 이 칩 섹션만 생략하고 레시피 데이터 조회는 그대로 진행한다.
  const ingredientNames = locationState?.ingredientNames ?? []

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
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-brand-text md:text-[32px]">레시피 조회 결과</h1>
        <p className="text-sm text-brand-text-sub">선택된 식재료</p>
      </div>

      {ingredientNames.length > 0 && (
        <div className="flex w-full flex-wrap items-center justify-center gap-2 rounded-3xl bg-white px-4 py-5 md:gap-3">
          {ingredientNames.map((name, index) => (
            <div
              key={name}
              className={`flex items-center gap-2 rounded-full px-4 py-2 ${CHIP_BG_CLASSES[index % CHIP_BG_CLASSES.length]}`}
            >
              <span className="text-sm font-medium text-brand-text md:text-base">{name}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-6">
        <div className="flex items-end justify-between gap-2 border-b border-brand-text/10 pb-2">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-brand-text md:text-xl">추천 레시피</h2>
              <Badge tone={result.source === 'db' ? 'secondary' : 'accent'}>
                {result.source === 'db' ? 'DB 매칭' : 'AI 생성'}
                {result.cached ? ' · 캐시' : ''}
              </Badge>
            </div>
            <p className="text-xs text-brand-text-sub md:text-sm">
              선택한 재료로 만들 수 있는 최고의 요리들입니다.
            </p>
          </div>
          {/* 정렬/필터 버튼은 레퍼런스 디자인 자리만 맞춰뒀다 — 기능은 이번 범위 밖 */}
          <button
            type="button"
            className="flex h-8 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-text/5 transition-colors hover:bg-brand-text/10"
            aria-hidden="true"
            tabIndex={-1}
          >
            <svg width="16" height="10" viewBox="0 0 18 12" fill="none">
              <path d="M7 12H11V10H7V12ZM0 0V2H18V0H0ZM3 7H15V5H3V7Z" fill="#1C1C15" />
            </svg>
          </button>
        </div>

        {result.recipes.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-sm text-brand-text-sub">해당 식재료로 레시피를 제작할 수 없습니다.</p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="rounded-full bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:opacity-90"
            >
              레시피 검색
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 pb-8 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
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
    </div>
  )
}
