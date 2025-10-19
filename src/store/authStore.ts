import { create } from 'zustand'

interface AuthState {
  user: null | { email: string }
  login: (email: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  login: (email) => set({ user: { email } }),
  logout: () => set({ user: null }),
}))
