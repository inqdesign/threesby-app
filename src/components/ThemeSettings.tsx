import { Moon, Sun, Monitor } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';

export function ThemeSettings() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="bg-card rounded-xl shadow-sm overflow-hidden mb-6">
      <div className="p-4 border-b border-border">
        <h3 className="text-foreground font-medium">Appearance</h3>
        <p className="text-sm text-muted-foreground mt-1">Choose how Threesby looks to you</p>
      </div>
      
      <div className="p-2">
        <button
          onClick={() => setTheme('light')}
          className={`w-full flex items-center justify-between p-3 rounded-lg ${
            theme === 'light' ? 'bg-muted' : 'hover:bg-muted/50'
          }`}
        >
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-3">
              <Sun size={18} className="text-foreground" />
            </div>
            <span className="text-foreground">Light</span>
          </div>
          {theme === 'light' && (
            <div className="w-4 h-4 rounded-full bg-foreground"></div>
          )}
        </button>
        
        <button
          onClick={() => setTheme('dark')}
          className={`w-full flex items-center justify-between p-3 rounded-lg ${
            theme === 'dark' ? 'bg-muted' : 'hover:bg-muted/50'
          }`}
        >
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-3">
              <Moon size={18} className="text-foreground" />
            </div>
            <span className="text-foreground">Dark</span>
          </div>
          {theme === 'dark' && (
            <div className="w-4 h-4 rounded-full bg-foreground"></div>
          )}
        </button>
        
        <button
          onClick={() => setTheme('system')}
          className={`w-full flex items-center justify-between p-3 rounded-lg ${
            theme === 'system' ? 'bg-muted' : 'hover:bg-muted/50'
          }`}
        >
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-3">
              <Monitor size={18} className="text-foreground" />
            </div>
            <span className="text-foreground">System</span>
          </div>
          {theme === 'system' && (
            <div className="w-4 h-4 rounded-full bg-foreground"></div>
          )}
        </button>
      </div>
    </div>
  );
}
