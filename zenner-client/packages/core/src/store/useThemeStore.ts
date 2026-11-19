import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  _resolveTheme: () => 'light' | 'dark';
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

const applyThemeClass = (resolved: 'light' | 'dark') => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
  }
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: getSystemTheme(),

      _resolveTheme: () => {
        const { theme } = get();
        return theme === 'system' ? getSystemTheme() : theme;
      },

      setTheme: (theme: Theme) => {
        const resolved = theme === 'system' ? getSystemTheme() : theme;
        applyThemeClass(resolved);
        set({ theme, resolvedTheme: resolved });
      },

      toggleTheme: () => {
        const { resolvedTheme } = get();
        const next = resolvedTheme === 'dark' ? 'light' : 'dark';
        applyThemeClass(next);
        set({ theme: next, resolvedTheme: next });
      },
    }),
    {
      name: 'zenner-theme',
      // Only persist theme preference, not resolvedTheme
      partialize: (state) => ({ theme: state.theme }),
      // After rehydration, apply theme immediately
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolved = state._resolveTheme();
          applyThemeClass(resolved);
          state.resolvedTheme = resolved;
        }
      },
    }
  )
);
