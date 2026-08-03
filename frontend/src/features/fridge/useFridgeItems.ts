import { useCallback, useEffect, useState } from 'react'
import { useSession } from '../../context/SessionContext'
import { listFridgeItems } from './api'
import type { FridgeItem } from './types'

export function useFridgeItems() {
  const { sessionId } = useSession()
  const [items, setItems] = useState<FridgeItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(() => {
    if (!sessionId) return
    setIsLoading(true)
    listFridgeItems(sessionId)
      .then((data) => {
        setItems(data)
        setError(null)
      })
      .catch(() => setError('냉장고 재료를 불러오지 못했습니다.'))
      .finally(() => setIsLoading(false))
  }, [sessionId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { items, isLoading, error, refetch }
}
