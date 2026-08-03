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
    expect(await screen.findByText('저장한 레시피가 없어요')).toBeInTheDocument()
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
})
