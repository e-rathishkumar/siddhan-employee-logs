import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../shared/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  login: (user: User, token: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setUser: (user) => set({ user }),
      setAccessToken: (token) => set({ accessToken: token }),
      setRefreshToken: (token) => set({ refreshToken: token }),
      login: (user, token, refreshToken) =>
        set({ user, accessToken: token, refreshToken, isAuthenticated: true }),
      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
