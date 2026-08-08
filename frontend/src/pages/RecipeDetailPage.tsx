import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge } from '../components/Badge'
import { Card } from '../components/Card'
import { ErrorState } from '../components/ErrorState'
import {
  ActivityIcon,
  ArrowLeftIcon,
  ClockIcon,
  HeartIcon,
  LinkIcon,
  TagIcon,
  UsersIcon,
} from '../components/icons'
import { Spinner } from '../components/Spinner'
import { useSession } from '../context/SessionContext'
import { trackEvent } from '../features/analytics/track'
import { listFridgeItems } from '../features/fridge/api'
import { getRecipe } from '../features/recipe/api'
import { CookModeControls } from '../features/recipe/components/CookModeControls'
import { RecipeIngredientList } from '../features/recipe/components/RecipeIngredientList'
import { splitInstructionSteps } from '../features/recipe/instructions'
import type { RecipeDetail } from '../features/recipe/types'
import { listSavedRecipes, saveRecipe, unsaveRecipe } from '../features/saved-recipes/api'
import { DIFFICULTY_LABELS, getApiErrorMessage, type RecipeDifficulty } from '../types/common'

const DIFFICULTY_TONE: Record<RecipeDifficulty, 'secondary' | 'neutral' | 'primary'> = {
  easy: 'secondary',
  normal: 'neutral',
  hard: 'primary',
}

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { sessionId } = useSession()

  const [recipe, setRecipe] = useState<RecipeDetail | null>(null)
  const [ownedIngredientIds, setOwnedIngredientIds] = useState<Set<string>>(new Set())
  const [isSaved, setIsSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaveToggling, setIsSaveToggling] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      // 클립보드 접근 실패는 조용히 무시한다.
    }
  }

  if (isLoading) return <Spinner label="레시피를 불러오는 중..." />
  if (error) return <ErrorState message={error} />
  if (!recipe) return null

  const instructionSteps = splitInstructionSteps(recipe.instructions)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 self-start text-sm text-brand-text/60 hover:text-brand-text"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        레시피 목록으로
      </button>

      <div>
        <h1 className="text-2xl font-semibold text-brand-primary">{recipe.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-brand-text/70">
          <button
            type="button"
            onClick={handleToggleSave}
            disabled={isSaveToggling}
            aria-label={isSaved ? '저장 해제' : '저장'}
            className="text-brand-primary disabled:opacity-50"
          >
            <HeartIcon className="h-5 w-5" filled={isSaved} />
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            aria-label="레시피 링크 복사"
            className="text-brand-text/50 hover:text-brand-text"
          >
            <LinkIcon className="h-5 w-5" />
          </button>
          {linkCopied && <span className="text-xs text-brand-text/50">링크가 복사됐어요</span>}
          {recipe.servings && (
            <span className="flex items-center gap-1">
              <UsersIcon className="h-4 w-4" />
              {recipe.servings}인분
            </span>
          )}
          <span className="flex items-center gap-1">
            <ClockIcon className="h-4 w-4" />
            {recipe.cooking_time_min}분
          </span>
          {recipe.difficulty && (
            <Badge tone={DIFFICULTY_TONE[recipe.difficulty]}>
              {DIFFICULTY_LABELS[recipe.difficulty]}
            </Badge>
          )}
        </div>
        {recipe.description && (
          <p className="mt-3 text-sm text-brand-text/70">{recipe.description}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="mb-2 flex items-center gap-1.5 font-medium">
            <TagIcon className="h-4 w-4 text-brand-primary" />
            필요한 식재료
          </h2>
          <RecipeIngredientList
            ingredients={recipe.ingredients}
            ownedIngredientIds={ownedIngredientIds}
          />
        </Card>

        <Card>
          <h2 className="mb-2 flex items-center gap-1.5 font-medium">
            <ActivityIcon className="h-4 w-4 text-brand-primary" />
            조리 순서
          </h2>
          <ol className="flex flex-col gap-3">
            {instructionSteps.map((step, index) => (
              <li key={index} className="flex gap-3">
                <span className="text-xl font-bold text-brand-primary/70">{index + 1}</span>
                <p className="pt-0.5 text-sm text-brand-text/80">{step}</p>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      {recipe.tip && (
        <div className="rounded-2xl bg-brand-accent/40 p-4 text-sm text-brand-text">
          <p className="mb-1 font-medium">💡 셰프의 팁</p>
          <p>{recipe.tip}</p>
        </div>
      )}

      {recipe.is_llm_generated && (
        <div className="rounded-2xl border border-brand-primary/20 bg-brand-primary/5 p-4 text-sm text-brand-text/80">
          <p className="mb-1 font-medium text-brand-primary">⚠ 안전 유의사항</p>
          <p>
            본 레시피는 AI가 생성한 참고용 정보입니다. 요리 전 식재료 신선도와 알레르기 유무를
            반드시 확인해 주세요.
          </p>
        </div>
      )}

      <CookModeControls recipeId={recipe.id} />
    </div>
  )
}
