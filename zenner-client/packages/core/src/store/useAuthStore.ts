import { create } from 'zustand';
import { authApi } from '../api/endpoints/auth.api';
import { ACCESS_TOKEN_COOKIE, deleteCookie, getCookie, isTokenExpired } from '../util/cookie';

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
    deleteCookie(ACCESS_TOKEN_COOKIE);
    set({ isAuthenticated: false, token: null });
    try {
      await authApi.logout({ allDevices });
    } catch {
      // Ignore API errors during logout
    }
  },

  checkAuth: async () => {
    // 1. Check if the non-HttpOnly access token cookie exists and has not expired
    const cookieToken = getCookie(ACCESS_TOKEN_COOKIE);
    if (cookieToken && !isTokenExpired(cookieToken)) {
      set({ isAuthenticated: true, token: cookieToken, isInitializing: false });
      return;
    }

    // 2. If access token is missing or expired, attempt refresh via HttpOnly refresh cookie
    try {
      const response = await authApi.refresh();
      set({ isAuthenticated: true, token: response.accessToken, isInitializing: false });
    } catch {
      set({ isAuthenticated: false, token: null, isInitializing: false });
    }
  },
}));
