import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { ErrorState } from '../components/ErrorState'
import { Spinner } from '../components/Spinner'
import { useSession } from '../context/SessionContext'
import { trackEvent } from '../features/analytics/track'
import { listFridgeItems } from '../features/fridge/api'
import { getRecipe } from '../features/recipe/api'
import { CookModeControls } from '../features/recipe/components/CookModeControls'
import { RecipeIngredientList } from '../features/recipe/components/RecipeIngredientList'
import type { RecipeDetail } from '../features/recipe/types'
import { listSavedRecipes, saveRecipe, unsaveRecipe } from '../features/saved-recipes/api'
import { getApiErrorMessage } from '../types/common'

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { sessionId } = useSession()

  const [recipe, setRecipe] = useState<RecipeDetail | null>(null)
  const [ownedIngredientIds, setOwnedIngredientIds] = useState<Set<string>>(new Set())
  const [isSaved, setIsSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaveToggling, setIsSaveToggling] = useState(false)

  useEffect(() => {
    if (!id || !sessionId) return
    let cancelled = false
    setIsLoading(true)
    Promise.all([getRecipe(id), listFridgeItems(sessionId), listSavedRecipes(sessionId)])
      .then(([recipeData, fridgeItems, savedRecipes]) => {
        if (cancelled) return
        setRecipe(recipeData)
        setOwnedIngredientIds(new Set(fridgeItems.map((item) => item.ingredient.id)))
        setIsSaved(savedRecipes.some((saved) => saved.recipe.id === id))
        setError(null)
        void trackEvent(sessionId, 'recipe_detail_view', { recipeId: id })
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, '레시피를 불러오지 못했습니다.'))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, sessionId])

  const handleToggleSave = async () => {
    if (!id || !sessionId) return
    setIsSaveToggling(true)
    try {
      if (isSaved) {
        await unsaveRecipe(sessionId, id)
        setIsSaved(false)
      } else {
        await saveRecipe(sessionId, id)
        setIsSaved(true)
        void trackEvent(sessionId, 'recipe_save', { recipeId: id })
      }
    } catch {
      // 저장/해제 실패는 조용히 무시한다 — 버튼 상태를 그대로 둬서 다시 시도할 수 있게 한다.
    } finally {
      setIsSaveToggling(false)
    }
  }

  if (isLoading) return <Spinner label="레시피를 불러오는 중..." />
  if (error) return <ErrorState message={error} />
  if (!recipe) return null

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{recipe.title}</h1>
        <div className="mt-2 flex items-center gap-2">
          <Badge tone="neutral">{recipe.cooking_time_min}분</Badge>
          {recipe.is_llm_generated && <Badge tone="accent">AI 생성 레시피</Badge>}
        </div>
      </div>

      <Card>
        <h2 className="mb-2 font-medium">필요한 재료</h2>
        <RecipeIngredientList
          ingredients={recipe.ingredients}
          ownedIngredientIds={ownedIngredientIds}
        />
      </Card>

      <Card>
        <h2 className="mb-2 font-medium">조리 순서</h2>
        <p className="whitespace-pre-line text-sm text-brand-text/80">{recipe.instructions}</p>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button
          variant={isSaved ? 'secondary' : 'primary'}
          onClick={handleToggleSave}
          disabled={isSaveToggling}
        >
          {isSaved ? '저장 해제' : '저장'}
        </Button>
      </div>

      <CookModeControls recipeId={recipe.id} />
    </div>
  )
}
