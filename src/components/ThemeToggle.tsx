import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useThemeStore();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md hover:bg-secondary transition-colors"
      aria-label="Toggle theme"
    >
      {resolvedTheme === 'light' ? (
        <Moon className="h-5 w-5 text-[#252525]" />
      ) : (
        <Sun className="h-5 w-5 text-[#f8f8f8]" />
      )}
    </button>
  );
}
