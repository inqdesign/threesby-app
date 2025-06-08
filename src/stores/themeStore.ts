import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

type ThemeState = {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  updateResolvedTheme: () => void;
};

// Helper function to detect system preference
const getSystemTheme = (): 'light' | 'dark' => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: getSystemTheme(),
      setTheme: (theme) => {
        set({ theme });
        // Update the resolved theme immediately
        if (theme === 'system') {
          set({ resolvedTheme: getSystemTheme() });
        } else {
          set({ resolvedTheme: theme as 'light' | 'dark' });
        }
      },
      updateResolvedTheme: () => {
        const { theme } = get();
        if (theme === 'system') {
          set({ resolvedTheme: getSystemTheme() });
        }
      }
    }),
    {
      name: 'theme-storage',
      // Only persist the theme preference, not the resolved theme
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
