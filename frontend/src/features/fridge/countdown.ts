const URGENT_WINDOW_HOURS = 3

export function getExpiryCountdownLabel(actionDueAt: string | null, now: Date): string | null {
  if (!actionDueAt) return null

  const remainingMs = new Date(actionDueAt).getTime() - now.getTime()
  if (remainingMs <= 0) return null

  const remainingHours = remainingMs / (1000 * 60 * 60)
  if (remainingHours > URGENT_WINDOW_HOURS) return null

  const hoursLeft = Math.max(1, Math.ceil(remainingHours))
  return `${hoursLeft}시간 남음`
}
