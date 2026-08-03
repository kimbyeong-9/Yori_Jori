import { useState } from 'react'
import { Button } from '../../../components/Button'
import { useSession } from '../../../context/SessionContext'
import { trackEvent } from '../../analytics/track'
import { completeCookSession, startCookSession } from '../api'

// cook_sessions는 백엔드 리소스로 실제 존재한다(BL-09, DL-015). 시작/완료 모두 서버에
// 기록한 뒤, 그 cook_session_id로 recipe_start/recipe_complete 이벤트도 남긴다.
export function CookModeControls({ recipeId }: { recipeId: string }) {
  const { sessionId } = useSession()
  const [cookSessionId, setCookSessionId] = useState<string | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStart = async () => {
    if (!sessionId) return
    setIsStarting(true)
    setError(null)
    try {
      const { cook_session_id } = await startCookSession(sessionId, recipeId)
      setCookSessionId(cook_session_id)
      setIsCompleted(false)
      void trackEvent(sessionId, 'recipe_start', {
        recipeId,
        metadata: { cook_session_id },
      })
    } catch {
      setError('조리를 시작하지 못했습니다. 다시 시도해주세요.')
    } finally {
      setIsStarting(false)
    }
  }

  const handleComplete = async () => {
    if (!sessionId || !cookSessionId) return
    setIsCompleting(true)
    setError(null)
    try {
      await completeCookSession(sessionId, cookSessionId)
      void trackEvent(sessionId, 'recipe_complete', {
        recipeId,
        metadata: { cook_session_id: cookSessionId },
      })
      setIsCompleted(true)
    } catch {
      setError('조리 완료 처리를 하지 못했습니다. 다시 시도해주세요.')
    } finally {
      setIsCompleting(false)
    }
  }

  if (isCompleted) {
    return (
      <div className="rounded-xl bg-brand-accent/40 p-4 text-sm text-brand-text">
        <p>조리를 완료했어요. 맛있게 드세요!</p>
        <Button variant="ghost" className="mt-2" onClick={handleStart} disabled={isStarting}>
          다시 조리하기
        </Button>
      </div>
    )
  }

  if (cookSessionId) {
    return (
      <div className="flex flex-col items-start gap-2 rounded-xl bg-brand-secondary/20 p-4">
        <p className="text-sm text-brand-text/70">조리 모드가 진행 중입니다.</p>
        {error && <p className="text-xs text-brand-primary">{error}</p>}
        <Button variant="primary" onClick={handleComplete} disabled={isCompleting}>
          {isCompleting ? '완료 처리 중...' : '요리 완료'}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start gap-2">
      {error && <p className="text-xs text-brand-primary">{error}</p>}
      <Button
        variant="primary"
        onClick={handleStart}
        className="self-start"
        disabled={isStarting}
      >
        {isStarting ? '시작하는 중...' : '이 레시피로 요리 시작'}
      </Button>
    </div>
  )
}
