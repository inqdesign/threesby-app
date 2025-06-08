import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface AppBarProps {
  title: string;
  showBackButton?: boolean;
  backPath?: string;
  onBack?: () => void;
  rightContent?: React.ReactNode;
}

export function AppBar({ 
  title, 
  showBackButton = true, 
  backPath, 
  onBack,
  rightContent 
}: AppBarProps) {
  const navigate = useNavigate();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center">
      {showBackButton && (
        <button 
          onClick={handleBack}
          className="p-1 rounded-full hover:bg-gray-100 mr-2"
          aria-label="Go back"
        >
          <ChevronLeft className="w-6 h-6 text-[#252525]" />
        </button>
      )}
      <h1 className="text-lg font-semibold text-[#252525] flex-1">{title}</h1>
      {rightContent && (
        <div className="flex items-center">
          {rightContent}
        </div>
      )}
    </div>
  );
}

export default AppBar;
