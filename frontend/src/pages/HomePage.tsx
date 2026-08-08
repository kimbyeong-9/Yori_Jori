import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { ClockIcon } from '../components/icons'
import { Spinner } from '../components/Spinner'
import { useSession } from '../context/SessionContext'
import { trackEvent } from '../features/analytics/track'
import { searchRecipesByNames } from '../features/recommendation/api'
import { useRecentRecipes } from '../features/recipe/useRecentRecipes'

const MAX_INGREDIENTS = 10
const SLIDER_SCROLL_AMOUNT = 220

export function HomePage() {
  const navigate = useNavigate()
  const { sessionId } = useSession()
  const { recipes: recentRecipes, isLoading: isRecentLoading, error: recentError } =
    useRecentRecipes()

  const [inputValue, setInputValue] = useState('')
  const [ingredients, setIngredients] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const sliderRef = useRef<HTMLDivElement>(null)
  const scrollSlider = (direction: number) => {
    sliderRef.current?.scrollBy({ left: direction * SLIDER_SCROLL_AMOUNT, behavior: 'smooth' })
  }

  const handleAdd = () => {
    const trimmed = inputValue.trim()
    if (!trimmed || ingredients.includes(trimmed) || ingredients.length >= MAX_INGREDIENTS) {
      setInputValue('')
      return
    }
    setIngredients((prev) => [...prev, trimmed])
    setInputValue('')
  }

  const handleRemove = (name: string) => {
    setIngredients((prev) => prev.filter((item) => item !== name))
  }

  const handleClearAll = () => setIngredients([])

  const handleSearch = async () => {
    if (ingredients.length === 0 || !sessionId) return
    setIsSearching(true)
    try {
      const result = await searchRecipesByNames(sessionId, ingredients)
      void trackEvent(sessionId, 'recommend_request', {
        metadata: { ingredient_names: ingredients },
      })
      navigate('/recipes', { state: { searchResult: result } })
    } catch {
      alert('해당 식재료로 레시피를 제작할 수 없습니다.')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <section
        className="relative left-1/2 w-screen -translate-x-1/2 flex flex-col items-center justify-center overflow-hidden px-4 py-20 text-center"
        style={{
          background: 'linear-gradient(135deg, #DBEAFE 0%, #FFFDE7 60%, #FFFDE7 100%)',
          minHeight: '380px',
        }}
      >
        <div className="mb-6 inline-flex items-center gap-2 text-sm font-bold tracking-wide text-brand-primary">
          <span className="relative flex h-2 w-2 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-primary/80" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-primary" />
          </span>
          AI추천 맛있는 레시피 뚝딱
        </div>

        <h1 className="mb-5 text-[28px] font-extrabold leading-[1.35] tracking-[-0.02em] text-brand-text sm:text-[34px] md:text-[44px] md:leading-[1.4]">
          냉장고 속 재료만{' '}
          <span className="bg-gradient-to-r from-brand-primary to-[#E35D5D] bg-clip-text text-transparent">
            알려주세요
          </span>
          <br />
          오늘을 위한{' '}
          <span className="relative z-10 inline-block w-fit text-brand-primary">
            최적의 레시피
            <span className="absolute bottom-1.5 left-0 -z-10 h-[30%] w-full rounded-sm rounded-br-2xl bg-brand-accent opacity-90 md:bottom-2" />
          </span>
        </h1>

        <p className="mx-auto mb-10 max-w-[90vw] break-keep text-sm font-medium leading-relaxed text-brand-text-sub md:whitespace-nowrap md:text-base">
          버려지는 식재료 없이, 매일 새롭고 맛있는 한 끼를 완성하세요.
        </p>

        <div className="w-full max-w-lg">
          <div className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2.5 shadow-md backdrop-blur-sm">
            <svg
              className="h-4 w-4 flex-shrink-0 text-brand-text-sub"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
            <input
              type="text"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.nativeEvent.isComposing) handleAdd()
              }}
              placeholder="재료 입력"
              className="flex-1 bg-transparent text-sm text-brand-text placeholder-brand-text-sub outline-none"
            />
            <button
              onClick={handleAdd}
              disabled={ingredients.length >= MAX_INGREDIENTS}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-primary transition-colors hover:opacity-90 disabled:opacity-40"
              aria-label="재료 추가"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
            </button>
          </div>

          {ingredients.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between px-1 text-xs text-brand-text-sub">
                <span>
                  입력한 재료 {ingredients.length}/{MAX_INGREDIENTS}
                </span>
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-1 transition-colors hover:text-brand-primary"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  전체 삭제
                </button>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {ingredients.map((name) => (
                  <span
                    key={name}
                    className="flex items-center gap-1.5 rounded-full border border-brand-text/20 bg-white px-4 py-1.5 text-sm font-medium text-brand-text shadow-sm"
                  >
                    {name}
                    <button
                      onClick={() => handleRemove(name)}
                      className="leading-none text-brand-text-sub transition-colors hover:text-brand-primary"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {isSearching ? (
            <div className="mt-8 flex flex-col items-center gap-3">
              <div className="h-11 w-11 animate-spin rounded-full border-4 border-brand-accent border-t-brand-primary" />
              <p className="animate-pulse text-sm text-brand-text-sub">
                레시피를 찾고 있어요...
              </p>
            </div>
          ) : (
            <button
              onClick={handleSearch}
              disabled={ingredients.length === 0}
              className="mx-auto mt-8 flex items-center gap-2 rounded-full bg-brand-accent px-10 py-3 text-base font-bold text-brand-primary shadow-sm transition-all hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              레시피 조회
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 12h20" />
                <path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" />
                <path d="m4 8 16-4" />
                <path d="m8.86 6.78-.45-1.81a2 2 0 0 1 1.45-2.43l1.94-.48a2 2 0 0 1 2.43 1.46l.45 1.8" />
              </svg>
            </button>
          )}
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-brand-text">최근 본 레시피</h2>
          {recentRecipes.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => scrollSlider(-1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-text/15 text-brand-text-sub transition-colors hover:border-brand-primary hover:text-brand-primary"
                aria-label="이전"
              >
                ‹
              </button>
              <button
                onClick={() => scrollSlider(1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-text/15 text-brand-text-sub transition-colors hover:border-brand-primary hover:text-brand-primary"
                aria-label="다음"
              >
                ›
              </button>
            </div>
          )}
        </div>

        {isRecentLoading && <Spinner label="최근 본 레시피 불러오는 중..." />}
        {recentError && <ErrorState message={recentError} />}
        {!isRecentLoading && !recentError && recentRecipes.length === 0 && (
          <EmptyState title="아직 본 레시피가 없어요" />
        )}
        {!isRecentLoading && !recentError && recentRecipes.length > 0 && (
          <div
            ref={sliderRef}
            className="flex gap-4 overflow-x-auto pb-2"
            style={{ scrollbarWidth: 'none' }}
          >
            {recentRecipes.map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => navigate(`/recipes/${recipe.id}`)}
                className="w-48 flex-shrink-0 cursor-pointer rounded-2xl border border-brand-text/10 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <p className="mb-2 truncate text-sm font-bold text-brand-text">{recipe.title}</p>
                <span className="flex items-center gap-1 text-xs text-brand-text-sub">
                  <ClockIcon className="h-3.5 w-3.5" />
                  {recipe.cooking_time_min}분
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section
        className="relative flex items-center justify-between gap-8 overflow-hidden rounded-3xl px-10 py-10"
        style={{ backgroundColor: 'var(--color-brand-accent)' }}
      >
        <div className="flex-1">
          <h3 className="mb-2 text-2xl font-bold text-brand-primary">냉장고 관리를 손쉽게</h3>
          <p className="mb-5 text-sm leading-relaxed text-brand-text-sub">
            남은 재료로 만드는 마법 같은 레시피를 제안해 드립니다.
            <br />
            체계적인 식재료 관리로 식비는 절약하고, 매일의 요리는 더 즐겁게.
            <br />
            지금 바로 재료를 등록하고 요리를 시작해보세요.
          </p>
          <div className="flex flex-col items-center gap-3 md:items-start">
            <span className="flex items-center gap-1 text-xs text-brand-text-sub">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              식재료 유통기한 관리도 한번에 해보세요
            </span>
            <button
              onClick={() => navigate('/fridge')}
              className="w-fit rounded-full bg-brand-primary px-7 py-3 text-sm font-bold text-white transition-colors hover:opacity-90"
            >
              시작하기
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
