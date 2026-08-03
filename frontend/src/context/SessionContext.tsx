import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { apiClient } from '../lib/apiClient'

const BROWSER_UUID_KEY = 'yorijori:browser_uuid'
const SESSION_ID_KEY = 'yorijori:session_id'

interface SessionContextValue {
  sessionId: string | null
  error: string | null
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined)

function getOrCreateBrowserUuid(): string {
  const existing = localStorage.getItem(BROWSER_UUID_KEY)
  if (existing) return existing
  const created = crypto.randomUUID()
  localStorage.setItem(BROWSER_UUID_KEY, created)
  return created
}

interface SessionResponse {
  session_id: string
  anonymous_user_id: string
  created_at: string
  expires_at: string
}

export function SessionProvider({ children }: { children: ReactNode }) {
  // 캐시된 session_id가 있으면 API 응답을 기다리지 않고 즉시 사용한다(새로고침 시 빠른 진입).
  // 백그라운드에서 POST /sessions로 재검증/갱신한다.
  const [sessionId, setSessionId] = useState<string | null>(() =>
    localStorage.getItem(SESSION_ID_KEY),
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const browserUuid = getOrCreateBrowserUuid()

    apiClient
      .post<SessionResponse>('/sessions', {
        browser_uuid: browserUuid,
        user_agent: navigator.userAgent,
      })
      .then((res) => {
        if (cancelled) return
        localStorage.setItem(SESSION_ID_KEY, res.data.session_id)
        setSessionId(res.data.session_id)
        setError(null)
      })
      .catch(() => {
        if (cancelled) return
        // 캐시된 session_id가 있으면 그걸 계속 쓰고(에러를 굳이 보여주지 않음),
        // 캐시조차 없으면 사용자에게 알린다.
        setError((prev) => prev ?? '세션을 시작하지 못했습니다. 잠시 후 다시 시도해주세요.')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(
    () => ({ sessionId, error: sessionId ? null : error }),
    [sessionId, error],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) {
    throw new Error('useSession은 SessionProvider 내부에서만 사용할 수 있습니다.')
  }
  return ctx
}
