import { useCallback, useEffect, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { Spinner } from '../components/Spinner'
import { useSession } from '../context/SessionContext'
import { listSavedRecipes, unsaveRecipe } from '../features/saved-recipes/api'
import { SavedRecipeCard } from '../features/saved-recipes/components/SavedRecipeCard'
import type { SavedRecipe } from '../features/saved-recipes/types'

export function SavedRecipesPage() {
  const { sessionId } = useSession()
  const [items, setItems] = useState<SavedRecipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unsavingId, setUnsavingId] = useState<string | null>(null)

  const refetch = useCallback(() => {
    if (!sessionId) return
    setIsLoading(true)
    listSavedRecipes(sessionId)
      .then((data) => {
        setItems(data)
        setError(null)
      })
      .catch(() => setError('저장한 레시피를 불러오지 못했습니다.'))
      .finally(() => setIsLoading(false))
  }, [sessionId])

  useEffect(() => {
    refetch()
  }, [refetch])

  const handleUnsave = async (savedRecipe: SavedRecipe) => {
    if (!sessionId) return
    setUnsavingId(savedRecipe.id)
    try {
      await unsaveRecipe(sessionId, savedRecipe.recipe.id)
      setItems((prev) => prev.filter((item) => item.id !== savedRecipe.id))
    } finally {
      setUnsavingId(null)
    }
  }

  if (isLoading) return <Spinner label="저장한 레시피를 불러오는 중..." />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">저장한 레시피</h1>
      {items.length === 0 ? (
        <EmptyState
          title="저장한 레시피가 없어요"
          description="마음에 드는 레시피를 저장해보세요."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <SavedRecipeCard
              key={item.id}
              savedRecipe={item}
              onUnsave={() => handleUnsave(item)}
              isUnsaving={unsavingId === item.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
