import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { SavedRecipesPage } from './SavedRecipesPage'

vi.mock('../context/SessionContext', () => ({
  useSession: () => ({ sessionId: 'session-1', error: null }),
}))

const listSavedRecipes = vi.fn()
const unsaveRecipe = vi.fn().mockResolvedValue(undefined)
vi.mock('../features/saved-recipes/api', () => ({
  listSavedRecipes: (...args: unknown[]) => listSavedRecipes(...args),
  unsaveRecipe: (...args: unknown[]) => unsaveRecipe(...args),
}))

describe('SavedRecipesPage', () => {
  it('저장한 레시피가 없으면 빈 상태를 보여준다', async () => {
    listSavedRecipes.mockResolvedValue([])
    render(
      <MemoryRouter>
        <SavedRecipesPage />
      </MemoryRouter>,
    )
    expect(await screen.findByText('아직 저장된 레시피가 없습니다.')).toBeInTheDocument()
  })

  it('목록을 보여주고 저장 해제가 동작한다', async () => {
    listSavedRecipes.mockResolvedValue([
      {
        id: 'sr-1',
        recipe: { id: 'r-1', title: '계란볶음밥', cooking_time_min: 15 },
        created_at: '2026-08-01T00:00:00Z',
      },
    ])
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <SavedRecipesPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('계란볶음밥')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '저장 해제' }))
    await waitFor(() => expect(unsaveRecipe).toHaveBeenCalledWith('session-1', 'r-1'))
    await waitFor(() => expect(screen.queryByText('계란볶음밥')).not.toBeInTheDocument())
  })

  it('저장한 레시피가 7개 이상이면 페이지네이션을 보여주고 2페이지로 넘어간다', async () => {
    const makeItem = (n: number) => ({
      id: `sr-${n}`,
      recipe: { id: `r-${n}`, title: `레시피${n}`, cooking_time_min: 10 },
      created_at: `2026-08-0${(n % 9) + 1}T00:00:00Z`,
    })
    listSavedRecipes.mockResolvedValue(Array.from({ length: 7 }, (_, i) => makeItem(i + 1)))
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <SavedRecipesPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('레시피1')).toBeInTheDocument()
    expect(screen.queryByText('레시피7')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '2' }))
    expect(await screen.findByText('레시피7')).toBeInTheDocument()
    expect(screen.queryByText('레시피1')).not.toBeInTheDocument()
  })
})
