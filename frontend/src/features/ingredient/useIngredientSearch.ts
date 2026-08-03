import { useEffect, useRef, useState } from 'react'
import { useSession } from '../../context/SessionContext'
import { trackEvent } from '../analytics/track'
import { listIngredients } from './api'
import type { Ingredient } from './types'

const DEBOUNCE_MS = 300

export function useIngredientSearch(initialQuery = '') {
  const { sessionId } = useSession()
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<Ingredient[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setResults([])
      setError(null)
      return
    }

    setIsLoading(true)
    debounceRef.current = setTimeout(() => {
      listIngredients({ query })
        .then((data) => {
          setResults(data)
          setError(null)
          void trackEvent(sessionId, 'ingredient_search', { metadata: { query } })
        })
        .catch(() => setError('재료 검색에 실패했습니다.'))
        .finally(() => setIsLoading(false))
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, sessionId])

  return { query, setQuery, results, isLoading, error }
}
