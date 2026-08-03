// docs/api-contract.md, backend/app/models/enums.py의 FreshnessStatus와 동일해야 한다.
export type FreshnessStatus = 'fresh' | 'near_expiry' | 'expired'

export const FRESHNESS_LABELS: Record<FreshnessStatus, string> = {
  fresh: '신선',
  near_expiry: '소비기한 임박',
  expired: '기한 지남',
}

// docs/api-contract.md §0 공통 에러 포맷.
export interface ApiErrorResponse {
  error: {
    code: string
    message: string
  }
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: { data?: unknown } }).response?.data === 'object'
  ) {
    const data = (error as { response?: { data?: ApiErrorResponse } }).response?.data
    if (data?.error?.message) {
      return data.error.message
    }
  }
  return fallback
}
