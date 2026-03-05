import { create } from 'zustand'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  setTokens: (access: string, refresh: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  setTokens: (access, refresh) => {
    localStorage.setItem('accessToken', access)
    localStorage.setItem('refreshToken', refresh)
    set({ accessToken: access, refreshToken: refresh })
  },
  clearAuth: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    set({ accessToken: null, refreshToken: null })
  },
}))
