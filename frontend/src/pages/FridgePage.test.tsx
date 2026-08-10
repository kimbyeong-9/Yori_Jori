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
const updateFridgeItem = vi.fn()
const deleteFridgeItem = vi.fn()
const createFridgeItem = vi.fn()
vi.mock('../features/fridge/api', () => ({
  listFridgeItems: (...args: unknown[]) => listFridgeItems(...args),
  updateFridgeItem: (...args: unknown[]) => updateFridgeItem(...args),
  deleteFridgeItem: (...args: unknown[]) => deleteFridgeItem(...args),
  createFridgeItem: (...args: unknown[]) => createFridgeItem(...args),
}))

const listIngredients = vi.fn()
const createIngredient = vi.fn()
vi.mock('../features/ingredient/api', () => ({
  listIngredients: (...args: unknown[]) => listIngredients(...args),
  createIngredient: (...args: unknown[]) => createIngredient(...args),
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

    const tag = await screen.findByRole('button', { name: /계란/ })
    await user.click(tag)

    const recommendButton = screen.getByRole('button', { name: /추천 요청 \(1\)/ })
    await user.click(recommendButton)

    expect(mockNavigate).toHaveBeenCalledWith('/recipes?fridge_item_ids=fi-1', {
      state: { ingredientNames: ['계란'] },
    })
  })

  it('관리모드에서 재료를 클릭하면 수정 패널이 열리고 삭제할 수 있다', async () => {
    listFridgeItems.mockResolvedValue([sampleItem])
    deleteFridgeItem.mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <FridgePage />
      </MemoryRouter>,
    )

    await screen.findByRole('button', { name: /계란/ })
    await user.click(screen.getByLabelText('선택 모드(요리 재료 선택)'))
    await user.click(screen.getByRole('button', { name: /계란/ }))

    expect(await screen.findByText('계란 수정')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '삭제' }))

    expect(deleteFridgeItem).toHaveBeenCalledWith('session-1', 'fi-1')
  })

  it('식재료 추가 모달에서 검색 결과를 선택해 냉장고에 등록한다', async () => {
    listFridgeItems.mockResolvedValue([])
    listIngredients.mockResolvedValue([
      { id: 'ing-2', name: '양파', category: '채소', unit: '개', is_top: true },
    ])
    createFridgeItem.mockResolvedValue({ ...sampleItem, id: 'fi-2' })
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <FridgePage />
      </MemoryRouter>,
    )

    await user.click(await screen.findByRole('button', { name: '재료 추가하기' }))
    await user.type(screen.getByPlaceholderText('재료 이름을 입력하세요 (예: 양파)'), '양파')
    await user.click(await screen.findByRole('button', { name: /양파/ }))
    await user.click(screen.getByRole('button', { name: '냉장고에 등록' }))

    expect(createFridgeItem).toHaveBeenCalledWith(
      expect.objectContaining({ session_id: 'session-1', ingredient_id: 'ing-2' }),
    )
  })
})
