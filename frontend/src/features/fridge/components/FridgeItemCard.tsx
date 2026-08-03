import { useState } from 'react'
import { Badge } from '../../../components/Badge'
import { Button } from '../../../components/Button'
import { Card } from '../../../components/Card'
import { FRESHNESS_LABELS, type FreshnessStatus } from '../../../types/common'
import type { FridgeItem, UpdateFridgeItemInput } from '../types'

const FRESHNESS_TONE: Record<FreshnessStatus, 'secondary' | 'accent' | 'primary'> = {
  fresh: 'secondary',
  near_expiry: 'accent',
  expired: 'primary',
}

interface FridgeItemCardProps {
  item: FridgeItem
  selected: boolean
  onToggleSelect: () => void
  onUpdate: (input: UpdateFridgeItemInput) => Promise<void>
  onDelete: () => Promise<void>
}

export function FridgeItemCard({
  item,
  selected,
  onToggleSelect,
  onUpdate,
  onDelete,
}: FridgeItemCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [quantity, setQuantity] = useState(item.quantity ?? '')
  const [freshness, setFreshness] = useState<FreshnessStatus>(item.freshness_status)
  const [foodExpiresAt, setFoodExpiresAt] = useState(item.food_expires_at?.slice(0, 10) ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onUpdate({
        quantity: quantity || undefined,
        freshness_status: freshness,
        food_expires_at: foodExpiresAt ? new Date(foodExpiresAt).toISOString() : null,
      })
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="mt-1 h-4 w-4 accent-brand-primary"
            aria-label={`${item.ingredient.name} 추천에 사용`}
          />
          <div>
            <p className="font-medium">{item.ingredient.name}</p>
            <p className="text-xs text-brand-text/50">{item.ingredient.category}</p>
          </div>
        </label>
        <Badge tone={FRESHNESS_TONE[item.freshness_status]}>
          {FRESHNESS_LABELS[item.freshness_status]}
        </Badge>
      </div>

      <div className="text-sm text-brand-text/70">
        {item.quantity && <p>보유량: {item.quantity}</p>}
        {item.food_expires_at && (
          <p>소비기한: {new Date(item.food_expires_at).toLocaleDateString('ko-KR')}</p>
        )}
      </div>

      {isEditing ? (
        <div className="flex flex-col gap-2 border-t border-brand-text/10 pt-3">
          <input
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            placeholder="보유량 (예: 2개)"
            className="rounded-lg border border-brand-text/20 px-3 py-1.5 text-sm"
          />
          <div className="flex gap-2">
            {(['fresh', 'near_expiry', 'expired'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFreshness(status)}
                className={`rounded-lg px-3 py-1 text-xs font-medium ${
                  freshness === status
                    ? 'bg-brand-primary text-white'
                    : 'bg-brand-text/5 text-brand-text'
                }`}
              >
                {FRESHNESS_LABELS[status]}
              </button>
            ))}
          </div>
          <input
            type="date"
            value={foodExpiresAt}
            onChange={(event) => setFoodExpiresAt(event.target.value)}
            className="rounded-lg border border-brand-text/20 px-3 py-1.5 text-sm"
          />
          <div className="flex gap-2">
            <Button variant="primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? '저장 중...' : '저장'}
            </Button>
            <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
              취소
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 border-t border-brand-text/10 pt-3">
          <Button variant="ghost" onClick={() => setIsEditing(true)}>
            수정
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? '삭제 중...' : '삭제'}
          </Button>
        </div>
      )}
    </Card>
  )
}
