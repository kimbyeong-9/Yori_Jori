import { describe, expect, it, vi } from 'vitest'
import { apiClient } from '../../lib/apiClient'
import { trackEvent } from './track'

vi.mock('../../lib/apiClient', () => ({
  apiClient: { post: vi.fn() },
}))

describe('trackEvent', () => {
  it('세션이 없으면 아무것도 호출하지 않는다', async () => {
    await trackEvent(null, 'ingredient_search')
    expect(apiClient.post).not.toHaveBeenCalled()
  })

  it('세션이 있으면 POST /events를 호출한다', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({})
    await trackEvent('session-1', 'recipe_click', {
      recipeId: 'r-1',
      metadata: { position: 2 },
    })
    expect(apiClient.post).toHaveBeenCalledWith('/events', {
      session_id: 'session-1',
      event_type: 'recipe_click',
      recipe_id: 'r-1',
      metadata: { position: 2 },
    })
  })

  it('전송이 실패해도 예외를 던지지 않는다', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error('network error'))
    await expect(trackEvent('session-1', 'recipe_save')).resolves.toBeUndefined()
  })
})
