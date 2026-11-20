import { create } from 'zustand';
import { authApi } from '../api/endpoints/auth.api';

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  isInitializing: boolean;
  login: (token: string) => void;
  setToken: (token: string | null) => void;
  logout: (allDevices?: boolean) => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  token: null,
  isInitializing: true,

  login: (token: string) => {
    set({ isAuthenticated: true, token });
  },

  setToken: (token: string | null) => {
    set({ isAuthenticated: Boolean(token), token });
  },

  logout: async (allDevices = false) => {
    set({ isAuthenticated: false, token: null });
    try {
      await authApi.logout({ allDevices });
    } catch {
      // Ignore API errors during logout
    }
  },

  checkAuth: async () => {
    try {
      const response = await authApi.refresh();
      set({ isAuthenticated: true, token: response.accessToken, isInitializing: false });
    } catch {
      set({ isAuthenticated: false, token: null, isInitializing: false });
    }
  },
}));
