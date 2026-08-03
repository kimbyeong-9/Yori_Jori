import axios from 'axios'

// Vite 개발 서버가 /api -> http://localhost:8000 로 프록시한다 (vite.config.ts).
// 백엔드에는 CORS를 추가하지 않는다.
export const apiClient = axios.create({
  baseURL: '/api/v1',
})
