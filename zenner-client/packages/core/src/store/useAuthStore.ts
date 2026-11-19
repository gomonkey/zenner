import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  isInitializing: boolean;
  login: (token: string) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  token: null,
  isInitializing: true,
  login: (token: string) => {
    localStorage.setItem('zenner_token', token);
    set({ isAuthenticated: true, token });
  },
  logout: () => {
    localStorage.removeItem('zenner_token');
    set({ isAuthenticated: false, token: null });
  },
  checkAuth: async () => {
    const token = localStorage.getItem('zenner_token');
    if (token) {
      set({ isAuthenticated: true, token, isInitializing: false });
    } else {
      set({ isAuthenticated: false, token: null, isInitializing: false });
    }
  }
}));
