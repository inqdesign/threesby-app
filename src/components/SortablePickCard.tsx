import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PickCard } from './PickCard';
import type { Pick } from '../types';

interface SortablePickCardProps {
  id: string;
  pick: Pick;
  category: 'places' | 'products' | 'books';
  index: number;
  onClick: () => void;
  onImageClick?: () => void;
  children?: React.ReactNode;
  isArchived?: boolean;
  isActive?: boolean;
}

export function SortablePickCard({
  id,
  pick,
  category,
  index,
  onClick,
  onImageClick,
  children,
  isArchived,
  isActive,
}: SortablePickCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  // Create a handler that will prevent drag from interfering with clicks
  const handleClick = () => {
    // Only trigger click if we're not dragging
    if (!isDragging && onClick) {
      onClick();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative cursor-grab active:cursor-grabbing"
    >
      {/* Drag handle overlay */}
      <div 
        className="absolute inset-0 z-20" 
        {...attributes}
        {...listeners}
      />
      {/* Clickable content */}
      <div 
        className="w-full h-full relative z-10" 
        onClick={handleClick}
      >
        <PickCard
          pick={pick}
          category={category}
          index={index}
          variant="myPick"
          onImageClick={onImageClick ? () => onImageClick() : undefined}
          isArchived={isArchived}
          isActive={isActive}
        >
          {children}
        </PickCard>
      </div>
    </div>
  );
}
