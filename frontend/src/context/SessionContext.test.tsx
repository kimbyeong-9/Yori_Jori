import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../lib/apiClient'
import { SessionProvider, useSession } from './SessionContext'

vi.mock('../lib/apiClient', () => ({
  apiClient: { post: vi.fn() },
}))

function Probe() {
  const { sessionId, error } = useSession()
  return <div>{sessionId ? `session:${sessionId}` : error ? `error:${error}` : 'loading'}</div>
}

describe('SessionProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(apiClient.post).mockReset()
  })

  it('POST /sessions로 세션을 받아 localStorage에 저장한다', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { session_id: 'abc-123', anonymous_user_id: 'u-1', created_at: '', expires_at: '' },
    })

    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    )

    await waitFor(() => screen.getByText('session:abc-123'))
    expect(localStorage.getItem('yorijori:session_id')).toBe('abc-123')
    expect(localStorage.getItem('yorijori:browser_uuid')).toBeTruthy()
  })

  it('캐시된 session_id가 있으면 API 응답 전에도 즉시 사용한다', () => {
    localStorage.setItem('yorijori:session_id', 'cached-session')
    localStorage.setItem('yorijori:browser_uuid', 'cached-browser')
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        session_id: 'cached-session',
        anonymous_user_id: 'u-1',
        created_at: '',
        expires_at: '',
      },
    })

    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    )

    expect(screen.getByText('session:cached-session')).toBeInTheDocument()
  })
})
