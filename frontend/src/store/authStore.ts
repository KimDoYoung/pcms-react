import { create } from 'zustand'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  userId: string | null
  setTokens: (access: string, refresh: string, userId: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  userId: localStorage.getItem('userId'),
  setTokens: (access, refresh, userId) => {
    localStorage.setItem('accessToken', access)
    localStorage.setItem('refreshToken', refresh)
    localStorage.setItem('userId', userId)
    set({ accessToken: access, refreshToken: refresh, userId })
  },
  clearAuth: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userId')
    set({ accessToken: null, refreshToken: null, userId: null })
  },
}))
