import { create } from 'zustand'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  userId: string | null
  userNm: string | null
  setTokens: (access: string, refresh: string, userId: string, userNm: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  userId: localStorage.getItem('userId'),
  userNm: localStorage.getItem('userNm'),
  setTokens: (access, refresh, userId, userNm) => {
    localStorage.setItem('accessToken', access)
    localStorage.setItem('refreshToken', refresh)
    localStorage.setItem('userId', userId)
    localStorage.setItem('userNm', userNm)
    set({ accessToken: access, refreshToken: refresh, userId, userNm })
  },
  clearAuth: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userId')
    localStorage.removeItem('userNm')
    set({ accessToken: null, refreshToken: null, userId: null, userNm: null })
  },
}))
