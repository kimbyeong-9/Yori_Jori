import { useState } from 'react'
import { FRESHNESS_LABELS, type FreshnessStatus } from '../../../types/common'
import type { FridgeItem, UpdateFridgeItemInput } from '../types'

const FRESHNESS_OPTIONS: FreshnessStatus[] = ['fresh', 'near_expiry', 'expired']

interface EditFridgeItemPanelProps {
  item: FridgeItem
  onSave: (input: UpdateFridgeItemInput) => Promise<void>
  onDelete: () => Promise<void>
  onClose: () => void
}

export function EditFridgeItemPanel({ item, onSave, onDelete, onClose }: EditFridgeItemPanelProps) {
  const [quantity, setQuantity] = useState(item.quantity ?? '')
  const [freshness, setFreshness] = useState<FreshnessStatus>(item.freshness_status)
  const [foodExpiresAt, setFoodExpiresAt] = useState(item.food_expires_at?.slice(0, 10) ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave({
        quantity: quantity || undefined,
        freshness_status: freshness,
        food_expires_at: foodExpiresAt ? new Date(foodExpiresAt).toISOString() : null,
      })
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete()
      onClose()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 px-4 pb-6 backdrop-blur-sm sm:items-center sm:pb-10"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-md flex-col rounded-t-3xl bg-white shadow-xl sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-center pt-4 pb-2">
          <div className="h-1.5 w-10 rounded-full bg-brand-text/15" />
        </div>

        <div className="flex flex-col gap-4 px-6 pb-7 pt-2">
          <h3 className="text-base font-semibold text-brand-text">
            {item.ingredient.name} 수정
          </h3>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-brand-text-sub">
              보유량
            </span>
            <input
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder={`예: 2${item.ingredient.unit}`}
              className="rounded-full bg-brand-text/5 px-4 py-2.5 text-sm outline-none"
            />
          </label>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-brand-text-sub">
              신선도
            </p>
            <div className="flex gap-2">
              {FRESHNESS_OPTIONS.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFreshness(status)}
                  className={`flex-1 rounded-full py-2 text-xs font-medium transition-colors ${
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
              실제 소비기한
            </span>
            <input
              type="date"
              value={foodExpiresAt}
              onChange={(event) => setFoodExpiresAt(event.target.value)}
              className="rounded-full bg-brand-text/5 px-4 py-2.5 text-sm outline-none"
            />
          </label>

          <div className="mt-1 flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isDeleting}
              className="flex-1 rounded-2xl bg-brand-primary py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isSaving ? '저장 중...' : '수정 완료'}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSaving || isDeleting}
              className="rounded-2xl bg-brand-text/5 px-5 py-3 text-sm font-medium text-brand-text-sub disabled:opacity-50"
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
