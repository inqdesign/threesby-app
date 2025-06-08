import React from 'react';
import { cn } from '../../lib/utils';

type CarouselContentProps = {
  children: React.ReactNode;
  className?: string;
};

export function CarouselContent({ children, className }: CarouselContentProps) {
  return (
    <div className={cn('relative h-full w-full overflow-hidden', className)}>
      {children}
    </div>
  );
}

type CarouselItemProps = {
  children: React.ReactNode;
  className?: string;
};

export function CarouselItem({ children, className }: CarouselItemProps) {
  return (
    <div className={cn('relative h-full w-full flex-[0_0_100%]', className)}>
      {children}
    </div>
  );
}