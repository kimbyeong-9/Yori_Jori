import { apiClient } from '../../lib/apiClient'
import type { EventType } from './eventTypes'

interface TrackOptions {
  recipeId?: string
  metadata?: Record<string, unknown>
}

// 백엔드 interaction_logs(POST /events)를 measurement의 source of truth로 쓴다.
// 이벤트 기록 실패가 사용자 플로우를 막으면 안 되므로 항상 조용히 무시한다.
export async function trackEvent(
  sessionId: string | null,
  eventType: EventType,
  options: TrackOptions = {},
): Promise<void> {
  if (!sessionId) return
  try {
    await apiClient.post('/events', {
      session_id: sessionId,
      event_type: eventType,
      recipe_id: options.recipeId,
      metadata: options.metadata ?? {},
    })
  } catch {
    // no-op: 이벤트 전송 실패는 무시한다.
  }
}
