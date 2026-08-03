import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// globals: true를 안 써서 (TS strict 설정 유지) 자동 cleanup을 직접 등록한다.
afterEach(() => {
  cleanup()
})
