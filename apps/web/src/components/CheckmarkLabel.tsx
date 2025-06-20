import { Check } from 'lucide-react';

interface CheckmarkLabelProps {
  isComplete: boolean;
  className?: string;
}

export function CheckmarkLabel({ isComplete, className = '' }: CheckmarkLabelProps) {
  return (
    <div 
      className={`w-6 h-6 rounded-full flex items-center justify-center ${
        isComplete 
          ? 'bg-[#a1ff7a]' 
          : 'bg-transparent border border-[#444444]'
      } ${className}`}
    >
      {isComplete && <Check className="w-4 h-4 text-black" />}
    </div>
  );
}
