import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { FridgeIcon, PencilIcon, PlusIcon } from '../components/icons'
import { Spinner } from '../components/Spinner'
import { Tabs } from '../components/Tabs'
import { useSession } from '../context/SessionContext'
import { trackEvent } from '../features/analytics/track'
import { deleteFridgeItem, updateFridgeItem } from '../features/fridge/api'
import { AddFridgeItemModal } from '../features/fridge/components/AddFridgeItemModal'
import { getExpiryCountdownLabel } from '../features/fridge/countdown'
import { EditFridgeItemPanel } from '../features/fridge/components/EditFridgeItemPanel'
import type { FridgeItem } from '../features/fridge/types'
import { useFridgeItems } from '../features/fridge/useFridgeItems'
import type { FreshnessStatus } from '../types/common'

const ALL_CATEGORY = '전체'
const COUNTDOWN_TICK_MS = 30_000

const FRESHNESS_TAG_CLASSES: Record<FreshnessStatus, string> = {
  fresh: 'bg-brand-text/5 text-brand-text',
  near_expiry: 'bg-brand-accent text-brand-text',
  expired: 'bg-brand-text/10 text-brand-text/40',
}

const SELECTED_TAG_CLASSES = 'bg-brand-secondary text-brand-text'
const MANAGE_TAG_OUTLINE = 'outline outline-1 outline-dashed outline-brand-text/25 outline-offset-2'

function groupByCategory(items: FridgeItem[]): [string, FridgeItem[]][] {
  const groups = new Map<string, FridgeItem[]>()
  for (const item of items) {
    const category = item.ingredient.category
    const bucket = groups.get(category)
    if (bucket) bucket.push(item)
    else groups.set(category, [item])
  }
  return Array.from(groups.entries())
}

export function FridgePage() {
  const navigate = useNavigate()
  const { sessionId } = useSession()
  const { items, isLoading, error, refetch } = useFridgeItems()
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isManageMode, setIsManageMode] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<FridgeItem | null>(null)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), COUNTDOWN_TICK_MS)
    return () => clearInterval(interval)
  }, [])

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

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.id)),
    [items, selectedIds],
  )

  const toggleSelected = (item: FridgeItem) => {
    if (item.freshness_status === 'expired') return
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

  const handleTagClick = (item: FridgeItem) => {
    if (isManageMode) setEditingItem(item)
    else toggleSelected(item)
  }

  const handleSaveEdit = async (item: FridgeItem, input: Parameters<typeof updateFridgeItem>[2]) => {
    if (!sessionId) return
    if (input.freshness_status) {
      void trackEvent(sessionId, 'freshness_selected', {
        metadata: { ingredient_id: item.ingredient.id, freshness: input.freshness_status },
      })
    }
    await updateFridgeItem(sessionId, item.id, input)
    refetch()
  }

  const handleDeleteItem = async (item: FridgeItem) => {
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
    navigate(`/recipes?fridge_item_ids=${Array.from(selectedIds).join(',')}`, {
      state: { ingredientNames: selectedItems.map((item) => item.ingredient.name) },
    })
  }

  const renderTag = (item: FridgeItem) => {
    const isSelected = !isManageMode && selectedIds.has(item.id)
    const countdownLabel = getExpiryCountdownLabel(item.action_due_at, now)
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => handleTagClick(item)}
        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          isSelected ? SELECTED_TAG_CLASSES : FRESHNESS_TAG_CLASSES[item.freshness_status]
        } ${isManageMode ? MANAGE_TAG_OUTLINE : ''}`}
      >
        {item.ingredient.name}
        {isSelected && <span className="ml-1 text-xs">✓</span>}
        {isManageMode && <PencilIcon className="ml-1 inline h-3 w-3 opacity-50" />}
        {countdownLabel && !isManageMode && (
          <span className="ml-1.5 text-xs text-brand-primary">{countdownLabel}</span>
        )}
      </button>
    )
  }

  if (isLoading) return <Spinner label="냉장고를 불러오는 중..." />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  return (
    <div className="flex flex-col gap-5 pb-28">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-brand-text">
          <FridgeIcon className="h-6 w-6 text-brand-primary" />
          나의 냉장고
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-full border border-brand-text/15 bg-white px-3 py-1.5 text-sm text-brand-text-sub transition-colors hover:border-brand-primary hover:text-brand-primary"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            식재료 추가
          </button>
          <button
            type="button"
            onClick={() => {
              setIsManageMode((prev) => !prev)
              setEditingItem(null)
            }}
            aria-pressed={isManageMode}
            aria-label={isManageMode ? '관리 모드(재료 수정·삭제)' : '선택 모드(요리 재료 선택)'}
            className={`relative h-7 w-[52px] flex-shrink-0 rounded-full transition-colors ${
              isManageMode ? 'bg-brand-primary' : 'bg-brand-text/20'
            }`}
          >
            <span
              className="absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition-all"
              style={{ left: isManageMode ? '27px' : '3px' }}
            />
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="냉장고가 비어있어요"
          description="식재료를 추가하면 여기에 표시됩니다."
          action={
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="mt-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-medium text-white"
            >
              재료 추가하기
            </button>
          }
        />
      ) : (
        <>
          <Tabs tabs={categories} active={activeCategory} onChange={setActiveCategory} />

          <div className="rounded-2xl border border-brand-text/10 bg-white p-5 shadow-sm">
            {activeCategory === ALL_CATEGORY ? (
              groupByCategory(visibleItems).map(([category, categoryItems]) => (
                <div key={category} className="mb-5 last:mb-0">
                  <p className="mb-2 text-xs font-semibold text-brand-text-sub">{category}</p>
                  <div className="flex flex-wrap gap-2">{categoryItems.map(renderTag)}</div>
                </div>
              ))
            ) : (
              <div className="flex flex-wrap gap-2">{visibleItems.map(renderTag)}</div>
            )}
          </div>

          {!isManageMode && selectedItems.length > 0 && (
            <div>
              <p className="mb-2 text-xs text-brand-text-sub">선택된 재료 {selectedItems.length}개</p>
              <div className="flex flex-wrap gap-2">
                {selectedItems.map((item) => (
                  <span
                    key={item.id}
                    className="flex items-center gap-1 rounded-full bg-brand-secondary px-3 py-1.5 text-xs font-medium text-brand-text"
                  >
                    {item.ingredient.name}
                    <button
                      type="button"
                      onClick={() => toggleSelected(item)}
                      className="ml-0.5 leading-none hover:opacity-70"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center border-t border-brand-text/10 bg-brand-background/95 px-4 py-3 backdrop-blur">
          <div className="flex w-full max-w-5xl gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-none rounded-2xl border border-brand-text/15 bg-white px-6 py-3 text-sm font-medium text-brand-text-sub hover:bg-brand-text/5"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={handleRecommend}
              disabled={selectedIds.size === 0 || isManageMode}
              className="flex-1 rounded-2xl bg-brand-primary py-3 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isManageMode ? '선택 모드로 전환 후 사용' : `추천 요청 (${selectedIds.size})`}
            </button>
          </div>
        </div>
      )}

      {showAddModal && (
        <AddFridgeItemModal onClose={() => setShowAddModal(false)} onAdded={refetch} />
      )}

      {editingItem && (
        <EditFridgeItemPanel
          item={editingItem}
          onSave={(input) => handleSaveEdit(editingItem, input)}
          onDelete={() => handleDeleteItem(editingItem)}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  )
}
