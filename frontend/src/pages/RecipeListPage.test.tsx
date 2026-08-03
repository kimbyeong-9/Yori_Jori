import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { RecipeListPage } from './RecipeListPage'

vi.mock('../context/SessionContext', () => ({
  useSession: () => ({ sessionId: 'session-1', error: null }),
}))
vi.mock('../features/analytics/track', () => ({ trackEvent: vi.fn() }))

const createRecommendation = vi.fn()
vi.mock('../features/recommendation/api', () => ({
  createRecommendation: (...args: unknown[]) => createRecommendation(...args),
}))

function renderWithQuery(query: string) {
  return render(
    <MemoryRouter initialEntries={[`/recipes?${query}`]}>
      <Routes>
        <Route path="/recipes" element={<RecipeListPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RecipeListPage', () => {
  it('선택된 재료가 없으면 안내 상태를 보여준다', () => {
    renderWithQuery('')
    expect(screen.getByText('선택된 재료가 없어요')).toBeInTheDocument()
  })

  it('추천 결과가 비어있으면 결과 없음 상태를 보여준다', async () => {
    createRecommendation.mockResolvedValue({
      recommendation_id: 'req-1',
      source: 'db',
      cached: false,
      recipes: [],
    })
    renderWithQuery('fridge_item_ids=fi-1')
    expect(await screen.findByText('추천 가능한 레시피가 없어요')).toBeInTheDocument()
  })

  it('추천 결과를 목록으로 보여주고 출처를 표시한다', async () => {
    createRecommendation.mockResolvedValue({
      recommendation_id: 'req-2',
      source: 'gemini',
      cached: true,
      recipes: [
        {
          id: 'r-1',
          title: '계란볶음밥',
          cooking_time_min: 15,
          instructions: '...',
          matched_ingredients: ['계란'],
          missing_ingredients: ['밥'],
          safety_note: null,
          match_score: 0.8,
        },
      ],
    })
    renderWithQuery('fridge_item_ids=fi-1,fi-2')
    expect(await screen.findByText('계란볶음밥')).toBeInTheDocument()
    expect(screen.getByText(/AI 생성/)).toBeInTheDocument()
  })
})
