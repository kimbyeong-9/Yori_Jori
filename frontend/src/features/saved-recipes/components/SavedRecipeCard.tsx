import { useNavigate } from 'react-router-dom'
import { ClockIcon, HeartIcon } from '../../../components/icons'
import type { SavedRecipe } from '../types'

interface SavedRecipeCardProps {
  savedRecipe: SavedRecipe
  onUnsave: () => void
  isUnsaving?: boolean
}

export function SavedRecipeCard({ savedRecipe, onUnsave, isUnsaving }: SavedRecipeCardProps) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/recipes/${savedRecipe.recipe.id}`)}
      className="relative flex cursor-pointer flex-col rounded-2xl border border-brand-text/10 bg-white p-4 shadow-sm transition-shadow hover:shadow-md md:p-5"
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onUnsave()
        }}
        disabled={isUnsaving}
        aria-label="저장 해제"
        className="absolute right-4 top-4 text-brand-primary transition-opacity disabled:opacity-40"
      >
        <HeartIcon className="h-[18px] w-[18px]" filled />
      </button>

      <h3 className="mb-3 min-h-[2.5rem] pr-7 text-[14px] font-semibold leading-snug text-brand-text line-clamp-2 md:text-[15px]">
        {savedRecipe.recipe.title}
      </h3>

      <div className="mt-auto flex items-center justify-between border-t border-brand-text/10 pt-3">
        <span className="text-xs text-brand-text-sub">
          {new Date(savedRecipe.created_at).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}{' '}
          저장됨
        </span>
        <span className="flex items-center gap-1 text-xs text-brand-text-sub">
          <ClockIcon className="h-3 w-3" />
          {savedRecipe.recipe.cooking_time_min}분
        </span>
      </div>
    </div>
  )
}
