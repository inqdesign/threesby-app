import React from 'react';
import { cn } from '../lib/utils';

type LabelVariant = 'small' | 'large';

interface LabelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: LabelVariant;
  children: React.ReactNode;
  isComplete?: boolean;
}

export function Label({
  variant = 'small',
  children,
  className,
  isComplete = false,
  ...props
}: LabelProps) {
  return (
    <div
      className={cn(
        'font-medium flex items-center justify-center',
        isComplete ? 'bg-[#a1ff7a] text-black' : 'bg-transparent text-[#252525] border border-[#444444]',
        variant === 'small' ? 'px-2 py-0.5 text-xs rounded-[4px]' : 'px-3 py-1 text-sm rounded-[4px]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
