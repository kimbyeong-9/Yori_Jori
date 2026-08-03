import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { RecipeDetailPage } from './RecipeDetailPage'

vi.mock('../context/SessionContext', () => ({
  useSession: () => ({ sessionId: 'session-1', error: null }),
}))
vi.mock('../features/analytics/track', () => ({ trackEvent: vi.fn() }))

const getRecipe = vi.fn()
const startCookSession = vi.fn().mockResolvedValue({
  cook_session_id: 'cook-1',
  started_at: '2026-08-04T00:00:00Z',
})
const completeCookSession = vi.fn().mockResolvedValue({ completed_at: '2026-08-04T00:10:00Z' })
vi.mock('../features/recipe/api', () => ({
  getRecipe: (...args: unknown[]) => getRecipe(...args),
  startCookSession: (...args: unknown[]) => startCookSession(...args),
  completeCookSession: (...args: unknown[]) => completeCookSession(...args),
}))

vi.mock('../features/fridge/api', () => ({
  listFridgeItems: vi.fn().mockResolvedValue([
    {
      id: 'fi-1',
      ingredient: { id: 'ing-1', name: '계란', category: '축산물', unit: '개', is_top: true },
      quantity: null,
      input_method: 'search',
      freshness_status: 'fresh',
      food_expires_at: null,
      action_due_at: null,
      created_at: '',
      updated_at: '',
    },
  ]),
}))

const saveRecipe = vi.fn().mockResolvedValue(undefined)
const unsaveRecipe = vi.fn().mockResolvedValue(undefined)
vi.mock('../features/saved-recipes/api', () => ({
  listSavedRecipes: vi.fn().mockResolvedValue([]),
  saveRecipe: (...args: unknown[]) => saveRecipe(...args),
  unsaveRecipe: (...args: unknown[]) => unsaveRecipe(...args),
}))

const sampleRecipe = {
  id: 'r-1',
  title: '계란볶음밥',
  source: 'manual',
  source_url: null,
  instructions: '1. 볶는다.',
  cooking_time_min: 15,
  is_llm_generated: false,
  created_at: '',
  ingredients: [
    {
      ingredient: { id: 'ing-1', name: '계란', category: '축산물', unit: '개', is_top: true },
      quantity: '2개',
      is_optional: false,
    },
    {
      ingredient: { id: 'ing-2', name: '밥', category: '곡류', unit: '공기', is_top: false },
      quantity: '1공기',
      is_optional: false,
    },
  ],
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/recipes/r-1']}>
      <Routes>
        <Route path="/recipes/:id" element={<RecipeDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RecipeDetailPage', () => {
  it('재료 보유/부족을 구분해 보여주고, 저장·조리 시작·완료 흐름이 동작한다', async () => {
    getRecipe.mockResolvedValue(sampleRecipe)
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByText('계란볶음밥')).toBeInTheDocument()
    expect(await screen.findAllByText('보유')).toHaveLength(1)
    expect(screen.getAllByText('부족')).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: '저장' }))
    await waitFor(() => expect(saveRecipe).toHaveBeenCalledWith('session-1', 'r-1'))
    expect(await screen.findByRole('button', { name: '저장 해제' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '이 레시피로 요리 시작' }))
    await waitFor(() => expect(startCookSession).toHaveBeenCalledWith('session-1', 'r-1'))
    expect(await screen.findByRole('button', { name: '요리 완료' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '요리 완료' }))
    await waitFor(() =>
      expect(completeCookSession).toHaveBeenCalledWith('session-1', 'cook-1'),
    )
    expect(await screen.findByText(/조리를 완료했어요/)).toBeInTheDocument()
  })
})
