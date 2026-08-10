import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ErrorState } from '../components/ErrorState'
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowLeftIcon,
  CheckIcon,
  ClockIcon,
  HeartIcon,
  LightbulbIcon,
  LinkIcon,
  TagIcon,
  UsersIcon,
} from '../components/icons'
import { Spinner } from '../components/Spinner'
import { useSession } from '../context/SessionContext'
import { trackEvent } from '../features/analytics/track'
import { listFridgeItems } from '../features/fridge/api'
import { getRecipe } from '../features/recipe/api'
import { RecipeIngredientList } from '../features/recipe/components/RecipeIngredientList'
import { splitInstructionSteps } from '../features/recipe/instructions'
import type { RecipeDetail } from '../features/recipe/types'
import { listSavedRecipes, saveRecipe, unsaveRecipe } from '../features/saved-recipes/api'
import { DIFFICULTY_LABELS, getApiErrorMessage } from '../types/common'

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
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <section className="flex flex-col gap-4 border-b border-brand-text/10 pb-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex w-fit items-center gap-1.5 text-sm font-medium text-brand-text-sub transition-colors hover:text-brand-primary"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          레시피 목록으로
        </button>

        <h1 className="text-[22px] font-bold leading-tight tracking-tight text-brand-primary md:text-[28px]">
          {recipe.title}
        </h1>

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <button
            type="button"
            onClick={handleToggleSave}
            disabled={isSaveToggling}
            aria-label={isSaved ? '저장 해제' : '저장'}
            className="flex-shrink-0 text-brand-primary transition-opacity disabled:opacity-50"
          >
            <HeartIcon className="h-[22px] w-[22px]" filled={isSaved} />
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            aria-label="레시피 링크 복사"
            title={linkCopied ? '링크가 복사되었습니다!' : '링크 복사'}
            className="flex-shrink-0 text-brand-text-sub transition-colors hover:text-brand-primary"
          >
            {linkCopied ? (
              <CheckIcon className="h-[22px] w-[22px] text-green-500" />
            ) : (
              <LinkIcon className="h-[22px] w-[22px]" />
            )}
          </button>
          {recipe.servings && (
            <span className="flex items-center gap-1.5 rounded-full bg-brand-text/5 px-3 py-1.5 text-xs font-medium text-brand-text">
              <UsersIcon className="h-3.5 w-3.5 text-brand-primary" />
              {recipe.servings}인분
            </span>
          )}
          <span className="flex items-center gap-1.5 rounded-full bg-brand-text/5 px-3 py-1.5 text-xs font-semibold text-brand-text">
            <ClockIcon className="h-3.5 w-3.5 text-brand-primary" />
            {recipe.cooking_time_min}분
          </span>
          {recipe.difficulty && (
            <span className="flex items-center gap-1.5 rounded-full bg-brand-accent px-3 py-1.5 text-xs font-semibold text-brand-text">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              {DIFFICULTY_LABELS[recipe.difficulty]}
            </span>
          )}
        </div>

        {recipe.description && (
          <p className="text-sm leading-relaxed text-brand-text/80 md:text-[15px]">
            {recipe.description}
          </p>
        )}
      </section>

      <section className="flex w-full flex-col items-start gap-8 lg:flex-row md:gap-12">
        <aside className="flex w-full flex-shrink-0 flex-col gap-4 lg:sticky lg:top-24 lg:w-[240px]">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-brand-text">
            <TagIcon className="h-4 w-4 text-brand-primary" />
            필요한 식재료
          </h2>
          <RecipeIngredientList
            ingredients={recipe.ingredients}
            ownedIngredientIds={ownedIngredientIds}
          />
        </aside>

        <div className="flex w-full flex-col gap-8 lg:flex-1">
          <div className="flex flex-col gap-6">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-brand-text md:text-[17px]">
              <ActivityIcon className="h-4 w-4 text-brand-primary" />
              조리 순서
            </h2>

            <div className="flex flex-col gap-8">
              {instructionSteps.length > 0 ? (
                instructionSteps.map((step, index) => (
                  <div key={index} className="relative flex flex-col pl-12">
                    <span
                      className="absolute left-0 top-0 select-none text-[40px] font-extrabold leading-none text-brand-accent"
                      style={{ WebkitTextStroke: '1.5px var(--color-brand-primary)', opacity: 0.6 }}
                    >
                      {index + 1}
                    </span>
                    <p className="mt-1 text-sm leading-relaxed text-brand-text/80 md:text-[15px]">
                      {step}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-brand-text-sub">조리 순서 정보가 없습니다.</p>
              )}
            </div>
          </div>

          {recipe.tip && (
            <div className="mt-4 flex gap-3 rounded-2xl border border-brand-accent bg-brand-accent/40 p-5">
              <LightbulbIcon className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 text-[#63610F]" />
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-semibold text-[#63610F]">셰프의 팁</h4>
                <p className="text-xs leading-relaxed text-[#63610F]/80 md:text-sm">{recipe.tip}</p>
              </div>
            </div>
          )}

          {recipe.is_llm_generated && (
            <div className="flex gap-3 rounded-r-2xl border-l-4 border-brand-primary bg-brand-primary/5 p-4">
              <AlertTriangleIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-primary" />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary">
                  안전 유의사항
                </span>
                <p className="text-xs leading-relaxed text-brand-primary/80 md:text-sm">
                  본 레시피는 AI가 생성한 참고용 정보입니다. 요리 전 식재료 신선도와 알레르기
                  유무를 반드시 확인해 주세요.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
