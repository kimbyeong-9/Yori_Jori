import { Link } from 'react-router-dom'
import { Button } from '../../../components/Button'
import { Card } from '../../../components/Card'
import type { SavedRecipe } from '../types'

interface SavedRecipeCardProps {
  savedRecipe: SavedRecipe
  onUnsave: () => void
  isUnsaving?: boolean
}

export function SavedRecipeCard({ savedRecipe, onUnsave, isUnsaving }: SavedRecipeCardProps) {
  return (
    <Card className="flex items-center justify-between gap-3">
      <Link to={`/recipes/${savedRecipe.recipe.id}`} className="flex-1">
        <p className="font-medium">{savedRecipe.recipe.title}</p>
        <p className="text-xs text-brand-text/50">
          저장일 {new Date(savedRecipe.created_at).toLocaleDateString('ko-KR')} ·{' '}
          {savedRecipe.recipe.cooking_time_min}분
        </p>
      </Link>
      <Button variant="ghost" onClick={onUnsave} disabled={isUnsaving}>
        {isUnsaving ? '해제 중...' : '저장 해제'}
      </Button>
    </Card>
  )
}
