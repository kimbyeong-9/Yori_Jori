import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { Spinner } from '../components/Spinner'
import { TopIngredientList } from '../features/ingredient/components/TopIngredientList'
import { useFridgeItems } from '../features/fridge/useFridgeItems'
import { useRecentRecipes } from '../features/recipe/useRecentRecipes'
import { FRESHNESS_LABELS, type FreshnessStatus } from '../types/common'

export function HomePage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { items: fridgeItems, isLoading: isFridgeLoading, error: fridgeError } = useFridgeItems()
  const {
    recipes: recentRecipes,
    isLoading: isRecentLoading,
    error: recentError,
  } = useRecentRecipes()

  const handleSearchSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!searchQuery.trim()) return
    navigate(`/ingredients/new?q=${encodeURIComponent(searchQuery)}`)
  }

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleViewRecipes = () => {
    if (selectedIds.size === 0) return
    navigate(`/recipes?fridge_item_ids=${Array.from(selectedIds).join(',')}`)
  }

  const freshnessCounts = fridgeItems.reduce<Record<string, number>>((acc, item) => {
    acc[item.freshness_status] = (acc[item.freshness_status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h1 className="mb-3 text-2xl font-semibold">오늘 뭐 해먹지?</h1>
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="식재료를 검색해 바로 등록해보세요"
            className="flex-1 rounded-xl border border-brand-text/20 bg-white px-4 py-2 text-sm focus:border-brand-primary focus:outline-none"
          />
          <Button type="submit">검색</Button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">대한민국 빈출 식재료 Top 10</h2>
        <TopIngredientList
          onSelect={(ingredient) => navigate('/ingredients/new', { state: { ingredient } })}
        />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">냉장고 재료 요약</h2>
          <Link to="/ingredients/new" className="text-sm font-medium text-brand-primary">
            + 신규 식재료 추가
          </Link>
        </div>
        {isFridgeLoading && <Spinner label="냉장고 재료 불러오는 중..." />}
        {fridgeError && <ErrorState message={fridgeError} />}
        {!isFridgeLoading && !fridgeError && fridgeItems.length === 0 && (
          <EmptyState
            title="등록된 재료가 없어요"
            description="식재료를 검색해서 냉장고에 추가해보세요."
            action={
              <Link to="/ingredients/new">
                <Button className="mt-2">재료 추가하기</Button>
              </Link>
            }
          />
        )}
        {!isFridgeLoading && !fridgeError && fridgeItems.length > 0 && (
          <Card className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-brand-text/70">
              <span>총 {fridgeItems.length}개</span>
              {(Object.keys(FRESHNESS_LABELS) as FreshnessStatus[]).map((status) =>
                freshnessCounts[status] ? (
                  <span key={status}>
                    {FRESHNESS_LABELS[status]} {freshnessCounts[status]}개
                  </span>
                ) : null,
              )}
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">선택 재료로 레시피 조회</p>
              <ul className="flex flex-wrap gap-2">
                {fridgeItems.map((item) => (
                  <li key={item.id}>
                    <label className="flex items-center gap-1.5 rounded-lg border border-brand-text/15 px-2.5 py-1 text-xs">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelected(item.id)}
                        className="accent-brand-primary"
                      />
                      {item.ingredient.name}
                    </label>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-3"
                onClick={handleViewRecipes}
                disabled={selectedIds.size === 0}
              >
                선택한 재료로 레시피 보기 ({selectedIds.size})
              </Button>
            </div>
          </Card>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">최근 본 레시피</h2>
        {isRecentLoading && <Spinner label="최근 본 레시피 불러오는 중..." />}
        {recentError && <ErrorState message={recentError} />}
        {!isRecentLoading && !recentError && recentRecipes.length === 0 && (
          <EmptyState title="아직 본 레시피가 없어요" />
        )}
        {!isRecentLoading && !recentError && recentRecipes.length > 0 && (
          <ul className="grid gap-2 sm:grid-cols-2">
            {recentRecipes.map((recipe) => (
              <li key={recipe.id}>
                <Link to={`/recipes/${recipe.id}`}>
                  <Card className="hover:border-brand-primary">
                    <p className="font-medium">{recipe.title}</p>
                    <p className="text-xs text-brand-text/50">{recipe.cooking_time_min}분</p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
