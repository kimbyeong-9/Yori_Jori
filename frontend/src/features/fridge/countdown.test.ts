import { describe, expect, it } from 'vitest'
import { getExpiryCountdownLabel } from './countdown'

const NOW = new Date('2026-08-06T00:00:00Z')

describe('getExpiryCountdownLabel', () => {
  it('action_due_at이 없으면 null을 반환한다', () => {
    expect(getExpiryCountdownLabel(null, NOW)).toBeNull()
  })

  it('3시간보다 많이 남으면 null을 반환한다', () => {
    const dueAt = new Date(NOW.getTime() + 3 * 60 * 60 * 1000 + 1000).toISOString()
    expect(getExpiryCountdownLabel(dueAt, NOW)).toBeNull()
  })

  it('정확히 3시간 남으면 3시간 남음을 반환한다', () => {
    const dueAt = new Date(NOW.getTime() + 3 * 60 * 60 * 1000).toISOString()
    expect(getExpiryCountdownLabel(dueAt, NOW)).toBe('3시간 남음')
  })

  it('2시간 10분 남으면 올림해서 3시간 남음을 반환한다', () => {
    const dueAt = new Date(NOW.getTime() + 2 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString()
    expect(getExpiryCountdownLabel(dueAt, NOW)).toBe('3시간 남음')
  })

  it('1시간 남으면 1시간 남음을 반환한다', () => {
    const dueAt = new Date(NOW.getTime() + 60 * 60 * 1000).toISOString()
    expect(getExpiryCountdownLabel(dueAt, NOW)).toBe('1시간 남음')
  })

  it('10분 남으면 최소 1시간 남음을 반환한다', () => {
    const dueAt = new Date(NOW.getTime() + 10 * 60 * 1000).toISOString()
    expect(getExpiryCountdownLabel(dueAt, NOW)).toBe('1시간 남음')
  })

  it('이미 지났으면 null을 반환한다', () => {
    const dueAt = new Date(NOW.getTime() - 1000).toISOString()
    expect(getExpiryCountdownLabel(dueAt, NOW)).toBeNull()
  })
})
