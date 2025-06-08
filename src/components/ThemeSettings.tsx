
import { Moon, Sun, Monitor } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';

export function ThemeSettings() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-[#252525] font-medium">Appearance</h3>
        <p className="text-sm text-[#9d9b9b] mt-1">Choose how Threesby looks to you</p>
      </div>
      
      <div className="p-2">
        <button
          onClick={() => setTheme('light')}
          className={`w-full flex items-center justify-between p-3 rounded-lg ${
            theme === 'light' ? 'bg-gray-100' : 'hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center mr-3">
              <Sun size={18} className="text-[#252525]" />
            </div>
            <span className="text-[#252525]">Light</span>
          </div>
          {theme === 'light' && (
            <div className="w-4 h-4 rounded-full bg-black"></div>
          )}
        </button>
        
        <button
          onClick={() => setTheme('dark')}
          className={`w-full flex items-center justify-between p-3 rounded-lg ${
            theme === 'dark' ? 'bg-gray-100' : 'hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center mr-3">
              <Moon size={18} className="text-[#252525]" />
            </div>
            <span className="text-[#252525]">Dark</span>
          </div>
          {theme === 'dark' && (
            <div className="w-4 h-4 rounded-full bg-black"></div>
          )}
        </button>
        
        <button
          onClick={() => setTheme('system')}
          className={`w-full flex items-center justify-between p-3 rounded-lg ${
            theme === 'system' ? 'bg-gray-100' : 'hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center mr-3">
              <Monitor size={18} className="text-[#252525]" />
            </div>
            <span className="text-[#252525]">System</span>
          </div>
          {theme === 'system' && (
            <div className="w-4 h-4 rounded-full bg-black"></div>
          )}
        </button>
      </div>
    </div>
  );
}
