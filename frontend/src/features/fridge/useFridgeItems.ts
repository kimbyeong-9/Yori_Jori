import { useCallback, useEffect, useState } from 'react'
import { useSession } from '../../context/SessionContext'
import { listFridgeItems } from './api'
import type { FridgeItem } from './types'

// 백엔드가 GET 조회 시점에 만료된(action_due_at 경과) 항목을 지우므로(lazy cleanup),
// 페이지를 열어둔 채로도 만료 항목이 자연히 사라지도록 주기적으로 다시 불러온다.
const REFETCH_INTERVAL_MS = 60_000

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

  // 만료 항목 정리를 위한 백그라운드 폴링은 로딩 스피너를 띄우지 않고 조용히 갱신한다.
  const pollSilently = useCallback(() => {
    if (!sessionId) return
    listFridgeItems(sessionId)
      .then((data) => setItems(data))
      .catch(() => {
        /* 백그라운드 폴링 실패는 기존 목록을 유지하고 무시한다 */
      })
  }, [sessionId])

  useEffect(() => {
    refetch()
  }, [refetch])

  useEffect(() => {
    const interval = setInterval(pollSilently, REFETCH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [pollSilently])

  return { items, isLoading, error, refetch }
}
