import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { HomePage } from './HomePage'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../context/SessionContext', () => ({
  useSession: () => ({ sessionId: 'session-1', error: null }),
}))

vi.mock('../features/ingredient/api', () => ({
  listIngredients: vi.fn().mockResolvedValue([]),
}))

vi.mock('../features/fridge/api', () => ({
  listFridgeItems: vi.fn().mockResolvedValue([]),
}))

vi.mock('../features/recipe/api', () => ({
  getRecentRecipes: vi.fn().mockResolvedValue([]),
}))

describe('HomePage', () => {
  it('데이터가 없을 때 각 섹션의 빈 상태를 보여준다', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )
    expect(await screen.findByText('등록된 인기 재료가 없습니다.')).toBeInTheDocument()
    expect(await screen.findByText('등록된 재료가 없어요')).toBeInTheDocument()
    expect(await screen.findByText('아직 본 레시피가 없어요')).toBeInTheDocument()
  })

  it('검색창 제출 시 재료 추가 페이지로 이동한다', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )
    const input = screen.getByPlaceholderText('식재료를 검색해 바로 등록해보세요')
    await user.type(input, '계란')
    await user.click(screen.getByRole('button', { name: '검색' }))
    expect(mockNavigate).toHaveBeenCalledWith('/ingredients/new?q=%EA%B3%84%EB%9E%80')
  })
})
