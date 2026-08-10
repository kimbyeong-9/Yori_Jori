import axios from 'axios'

// 로컬 개발은 Vite 프록시가 /api -> http://localhost:8000 로 넘겨줘 상대 경로만으로
// 충분하다(vite.config.ts). 배포 환경(Vercel)은 프록시가 없어 백엔드(Render) 절대
// URL이 필요하다 — VITE_API_BASE_URL이 있으면 그걸 쓰고, 없으면 로컬 동작을 그대로 둔다.
const baseURL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api/v1`
  : '/api/v1'

export const apiClient = axios.create({ baseURL })
