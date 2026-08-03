import { useEffect, useState } from 'react'
import { useSession } from '../../context/SessionContext'
import { getRecentRecipes } from './api'
import type { RecipeSummary } from './types'

export function useRecentRecipes() {
  const { sessionId } = useSession()
  const [recipes, setRecipes] = useState<RecipeSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false
    setIsLoading(true)
    getRecentRecipes(sessionId)
      .then((data) => {
        if (!cancelled) {
          setRecipes(data)
          setError(null)
        }
      })
      .catch(() => {
        if (!cancelled) setError('최근 본 레시피를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [sessionId])

  return { recipes, isLoading, error }
}
