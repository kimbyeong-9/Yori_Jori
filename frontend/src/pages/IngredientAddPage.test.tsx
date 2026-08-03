import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { IngredientAddPage } from './IngredientAddPage'

vi.mock('../context/SessionContext', () => ({
  useSession: () => ({ sessionId: 'session-1', error: null }),
}))

vi.mock('../features/analytics/track', () => ({ trackEvent: vi.fn() }))

vi.mock('../features/ingredient/api', () => ({
  listIngredients: vi
    .fn()
    .mockResolvedValue([{ id: 'ing-1', name: '계란', category: '축산물', unit: '개', is_top: true }]),
}))

const createFridgeItem = vi.fn().mockResolvedValue({})
vi.mock('../features/fridge/api', () => ({
  createFridgeItem: (...args: unknown[]) => createFridgeItem(...args),
}))

describe('IngredientAddPage', () => {
  it('검색 → 선택 → 등록 흐름이 동작한다', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/ingredients/new']}>
        <IngredientAddPage />
      </MemoryRouter>,
    )

    const searchInput = screen.getByPlaceholderText('식재료를 검색하세요 (예: 계란)')
    await user.type(searchInput, '계란')

    const resultButton = await screen.findByRole('button', { name: /계란/ })
    await user.click(resultButton)

    expect(await screen.findByText('신선')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '냉장고 등록' }))

    await waitFor(() =>
      expect(createFridgeItem).toHaveBeenCalledWith(
        expect.objectContaining({
          session_id: 'session-1',
          ingredient_id: 'ing-1',
          freshness_status: 'fresh',
          input_method: 'search',
        }),
      ),
    )
  })
})
