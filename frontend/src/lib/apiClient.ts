import axios from 'axios'
import { useAuthStore } from '@/shared/store/authStore'

// 개발: http://localhost:8585/pcms (로컬 백엔드 직접)
// 배포: /pcms (Tomcat same-origin, context-path /pcms)
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.PROD ? '/pcms' : 'http://localhost:8585/pcms'),
  headers: { Accept: 'application/json' },
})

instance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

instance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth()
      window.location.href = import.meta.env.PROD ? '/pcms/login' : '/login'
    }
    return Promise.reject(error)
  },
)

// response.data를 직접 반환하는 인터셉터로 인해 타입을 재정의
export const apiClient = instance as unknown as {
  get<T = unknown>(url: string, config?: object): Promise<T>
  post<T = unknown>(url: string, data?: unknown, config?: object): Promise<T>
  put<T = unknown>(url: string, data?: unknown, config?: object): Promise<T>
  delete<T = unknown>(url: string, config?: object): Promise<T>
}
