import { useEffect } from 'react';
import { useThemeStore } from '../stores/themeStore';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { resolvedTheme, updateResolvedTheme, theme } = useThemeStore();

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Initial update - ensure resolved theme is correct after hydration
    updateResolvedTheme();
    
    // Update when system preference changes
    const handleChange = () => {
      updateResolvedTheme();
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [updateResolvedTheme]);

  // Apply theme class to HTML element
  useEffect(() => {
    // Remove both classes first
    document.documentElement.classList.remove('light', 'dark');
    // Add the resolved theme class
    document.documentElement.classList.add(resolvedTheme);
    
    // Debug logging to help track theme changes
    console.log('Theme applied:', { theme, resolvedTheme });
  }, [resolvedTheme, theme]);

  return <>{children}</>;
}
