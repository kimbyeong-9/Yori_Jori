import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ErrorState } from '../components/ErrorState'
import { HeartIcon } from '../components/icons'
import { Spinner } from '../components/Spinner'
import { useSession } from '../context/SessionContext'
import { listSavedRecipes, unsaveRecipe } from '../features/saved-recipes/api'
import { SavedRecipeCard } from '../features/saved-recipes/components/SavedRecipeCard'
import type { SavedRecipe } from '../features/saved-recipes/types'

const PAGE_SIZE = 6

export function SavedRecipesPage() {
  const navigate = useNavigate()
  const { sessionId } = useSession()
  const [items, setItems] = useState<SavedRecipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unsavingId, setUnsavingId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

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

  const totalPages = Math.ceil(items.length / PAGE_SIZE)
  const pagedItems = useMemo(
    () => items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [items, currentPage],
  )

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

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
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="flex flex-col gap-1 border-b border-brand-text/10 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-brand-primary md:text-2xl">
          저장된 레시피
        </h1>
        <p className="text-xs text-brand-text-sub md:text-sm">
          마음에 들어 찜해둔 나만의 레시피 목록입니다.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <HeartIcon className="h-12 w-12 text-brand-text/15" />
          <p className="text-sm text-brand-text-sub">아직 저장된 레시피가 없습니다.</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-2 rounded-full bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:opacity-90"
          >
            새로운 레시피 찾으러 가기
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pagedItems.map((item) => (
              <SavedRecipeCard
                key={item.id}
                savedRecipe={item}
                onUnsave={() => handleUnsave(item)}
                isUnsaving={unsavingId === item.id}
              />
            ))}
          </div>

          {items.length >= 7 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="이전 페이지"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-text/15 bg-white text-brand-text-sub transition-colors hover:bg-brand-text/5 disabled:cursor-not-allowed disabled:opacity-30"
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => goToPage(page)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    currentPage === page
                      ? 'bg-brand-primary text-white shadow-sm'
                      : 'border border-brand-text/15 bg-white text-brand-text-sub hover:bg-brand-text/5'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="다음 페이지"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-text/15 bg-white text-brand-text-sub transition-colors hover:bg-brand-text/5 disabled:cursor-not-allowed disabled:opacity-30"
              >
                ›
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
