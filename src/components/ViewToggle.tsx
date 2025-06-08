// No React import needed with modern JSX transform
import { Grid3x3, Award } from 'lucide-react';

type ViewMode = 'all' | 'top';

interface ViewToggleProps {
  activeView: ViewMode;
  onChange: (view: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ activeView, onChange, className = '' }: ViewToggleProps) {
  return (
    <div className={`inline-flex h-[34px] rounded-full border border-gray-300 ${className}`}>
      <button
        className={`flex h-full items-center gap-1.5 rounded-l-full px-4 text-xs font-medium transition-colors ${
          activeView === 'all'
            ? 'bg-black text-white'
            : 'bg-transparent text-gray-600 hover:bg-gray-50'
        }`}
        onClick={() => onChange('all')}
        aria-label="View all items"
      >
        <Grid3x3 className="w-3.5 h-3.5" />
        <span>All items</span>
      </button>
      <button
        className={`flex h-full items-center gap-1.5 rounded-r-full px-4 text-xs font-medium transition-colors ${
          activeView === 'top'
            ? 'bg-black text-white'
            : 'bg-transparent text-gray-600 hover:bg-gray-50'
        }`}
        onClick={() => onChange('top')}
        aria-label="View top picks"
      >
        <Award className="w-3.5 h-3.5" />
        <span>Top picks</span>
      </button>
    </div>
  );
}
