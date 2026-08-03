import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { FridgePage } from './FridgePage'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../context/SessionContext', () => ({
  useSession: () => ({ sessionId: 'session-1', error: null }),
}))
vi.mock('../features/analytics/track', () => ({ trackEvent: vi.fn() }))

const listFridgeItems = vi.fn()
vi.mock('../features/fridge/api', () => ({
  listFridgeItems: (...args: unknown[]) => listFridgeItems(...args),
  updateFridgeItem: vi.fn(),
  deleteFridgeItem: vi.fn(),
}))

const sampleItem = {
  id: 'fi-1',
  ingredient: { id: 'ing-1', name: '계란', category: '축산물', unit: '개', is_top: true },
  quantity: '2개',
  input_method: 'search',
  freshness_status: 'fresh',
  food_expires_at: null,
  action_due_at: '2026-08-04T00:00:00Z',
  created_at: '2026-08-02T00:00:00Z',
  updated_at: '2026-08-02T00:00:00Z',
}

describe('FridgePage', () => {
  it('재료가 없으면 빈 상태를 보여준다', async () => {
    listFridgeItems.mockResolvedValue([])
    render(
      <MemoryRouter>
        <FridgePage />
      </MemoryRouter>,
    )
    expect(await screen.findByText('냉장고가 비어있어요')).toBeInTheDocument()
  })

  it('재료를 선택하고 추천을 요청하면 /recipes로 이동한다', async () => {
    listFridgeItems.mockResolvedValue([sampleItem])
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <FridgePage />
      </MemoryRouter>,
    )

    const checkbox = await screen.findByLabelText('계란 추천에 사용')
    await user.click(checkbox)

    const recommendButton = screen.getByRole('button', { name: /선택 재료로 추천 요청/ })
    await user.click(recommendButton)

    expect(mockNavigate).toHaveBeenCalledWith('/recipes?fridge_item_ids=fi-1')
  })
})
