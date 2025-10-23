import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  email: string;
  name: string;
  plan: 'free' | 'pro' | 'premium';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        // Demo authentication - accepts demo@indicium.com / demo123
        // or any email/password with length > 3
        if (
          (email === 'demo@indicium.com' && password === 'demo123') ||
          (email.includes('@') && password.length >= 3)
        ) {
          const user: User = {
            email,
            name: email.split('@')[0],
            plan: email === 'demo@indicium.com' ? 'pro' : 'free'
          };
          set({ user, isAuthenticated: true });
          return true;
        }
        return false;
      },

      register: async (email: string, password: string, name: string) => {
        // Demo registration - accepts any valid email and password length > 3
        if (email.includes('@') && password.length >= 3 && name.length > 0) {
          const user: User = {
            email,
            name,
            plan: 'free'
          };
          set({ user, isAuthenticated: true });
          return true;
        }
        return false;
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      }
    }),
    {
      name: 'indicium-auth-storage'
    }
  )
);
