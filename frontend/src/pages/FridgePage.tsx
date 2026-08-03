import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { Spinner } from '../components/Spinner'
import { Tabs } from '../components/Tabs'
import { useSession } from '../context/SessionContext'
import { trackEvent } from '../features/analytics/track'
import { deleteFridgeItem, updateFridgeItem } from '../features/fridge/api'
import { FridgeItemCard } from '../features/fridge/components/FridgeItemCard'
import type { FridgeItem, UpdateFridgeItemInput } from '../features/fridge/types'
import { useFridgeItems } from '../features/fridge/useFridgeItems'

const ALL_CATEGORY = '전체'

export function FridgePage() {
  const navigate = useNavigate()
  const { sessionId } = useSession()
  const { items, isLoading, error, refetch } = useFridgeItems()
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const categories = useMemo(() => {
    const unique = Array.from(new Set(items.map((item) => item.ingredient.category)))
    return [ALL_CATEGORY, ...unique]
  }, [items])

  const visibleItems = useMemo(
    () =>
      activeCategory === ALL_CATEGORY
        ? items
        : items.filter((item) => item.ingredient.category === activeCategory),
    [items, activeCategory],
  )

  const toggleSelected = (item: FridgeItem) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const nowSelected = !next.has(item.id)
      if (nowSelected) next.add(item.id)
      else next.delete(item.id)
      void trackEvent(sessionId, 'ingredient_selected', {
        metadata: { ingredient_id: item.ingredient.id, selected: nowSelected },
      })
      return next
    })
  }

  const handleUpdate = async (item: FridgeItem, input: UpdateFridgeItemInput) => {
    if (!sessionId) return
    if (input.freshness_status) {
      void trackEvent(sessionId, 'freshness_selected', {
        metadata: { ingredient_id: item.ingredient.id, freshness: input.freshness_status },
      })
    }
    await updateFridgeItem(sessionId, item.id, input)
    refetch()
  }

  const handleDelete = async (item: FridgeItem) => {
    if (!sessionId) return
    await deleteFridgeItem(sessionId, item.id)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(item.id)
      return next
    })
    refetch()
  }

  const handleRecommend = () => {
    if (selectedIds.size === 0) return
    void trackEvent(sessionId, 'recommend_request', {
      metadata: { fridge_item_ids: Array.from(selectedIds) },
    })
    navigate(`/recipes?fridge_item_ids=${Array.from(selectedIds).join(',')}`)
  }

  if (isLoading) return <Spinner label="냉장고를 불러오는 중..." />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">냉장고</h1>
        <Button onClick={handleRecommend} disabled={selectedIds.size === 0}>
          선택 재료로 추천 요청 ({selectedIds.size})
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="냉장고가 비어있어요"
          description="식재료를 등록하면 여기에 표시됩니다."
        />
      ) : (
        <>
          <Tabs tabs={categories} active={activeCategory} onChange={setActiveCategory} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleItems.map((item) => (
              <FridgeItemCard
                key={item.id}
                item={item}
                selected={selectedIds.has(item.id)}
                onToggleSelect={() => toggleSelected(item)}
                onUpdate={(input) => handleUpdate(item, input)}
                onDelete={() => handleDelete(item)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
