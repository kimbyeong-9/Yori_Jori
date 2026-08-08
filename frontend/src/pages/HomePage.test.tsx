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

const trackEvent = vi.fn()
vi.mock('../features/analytics/track', () => ({
  trackEvent: (...args: unknown[]) => trackEvent(...args),
}))

const getRecentRecipes = vi.fn()
vi.mock('../features/recipe/api', () => ({
  getRecentRecipes: (...args: unknown[]) => getRecentRecipes(...args),
}))

const searchRecipesByNames = vi.fn()
vi.mock('../features/recommendation/api', () => ({
  searchRecipesByNames: (...args: unknown[]) => searchRecipesByNames(...args),
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )
}

describe('HomePage', () => {
  it('최근 본 레시피가 없으면 빈 상태를 보여준다', async () => {
    getRecentRecipes.mockResolvedValue([])
    renderPage()
    expect(await screen.findByText('아직 본 레시피가 없어요')).toBeInTheDocument()
  })

  it('재료를 입력해 칩으로 추가하고 검색하면 결과와 함께 /recipes로 이동한다', async () => {
    getRecentRecipes.mockResolvedValue([])
    const searchResult = {
      recommendation_id: 'req-1',
      source: 'db',
      cached: false,
      recipes: [],
    }
    searchRecipesByNames.mockResolvedValue(searchResult)
    const user = userEvent.setup()
    renderPage()

    const input = screen.getByPlaceholderText('재료 입력')
    await user.type(input, '계란')
    await user.click(screen.getByRole('button', { name: '재료 추가' }))

    expect(screen.getByText('계란')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /레시피 조회/ }))

    expect(searchRecipesByNames).toHaveBeenCalledWith('session-1', ['계란'])
    expect(mockNavigate).toHaveBeenCalledWith('/recipes', { state: { searchResult } })
    expect(trackEvent).toHaveBeenCalledWith('session-1', 'recommend_request', {
      metadata: { ingredient_names: ['계란'] },
    })
  })

  it('같은 재료를 두 번 추가하면 중복으로 무시한다', async () => {
    getRecentRecipes.mockResolvedValue([])
    const user = userEvent.setup()
    renderPage()

    const input = screen.getByPlaceholderText('재료 입력')
    await user.type(input, '계란')
    await user.click(screen.getByRole('button', { name: '재료 추가' }))
    await user.type(input, '계란')
    await user.click(screen.getByRole('button', { name: '재료 추가' }))

    expect(screen.getAllByText('계란')).toHaveLength(1)
  })

  it('전체 삭제를 누르면 입력한 재료가 모두 사라진다', async () => {
    getRecentRecipes.mockResolvedValue([])
    const user = userEvent.setup()
    renderPage()

    const input = screen.getByPlaceholderText('재료 입력')
    await user.type(input, '양파')
    await user.click(screen.getByRole('button', { name: '재료 추가' }))
    expect(screen.getByText('양파')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '전체 삭제' }))
    expect(screen.queryByText('양파')).not.toBeInTheDocument()
  })

  it('"시작하기" 배너 버튼을 누르면 /fridge로 이동한다', async () => {
    getRecentRecipes.mockResolvedValue([])
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '시작하기' }))
    expect(mockNavigate).toHaveBeenCalledWith('/fridge')
  })
})
