import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Archive } from 'lucide-react';
import type { Pick } from '../types';

type SortablePickProps = {
  pick: Pick;
  index: number;
  isTop3: boolean;
  isPublished: boolean;
  onClick: () => void;
};

export function SortablePick({ pick, index, isTop3, isPublished, onClick }: SortablePickProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: pick.id,
    disabled: !isTop3 || !isPublished
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : 'auto',
    opacity: isDragging ? 0 : 1,
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      return;
    }
    
    e.stopPropagation();
    onClick();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative aspect-square bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all ${
        isTop3 ? 'cursor-move' : 'cursor-pointer'
      } ${!pick.visible ? 'opacity-50' : ''}`}
      onClick={handleClick}
    >
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        <span className="text-[10px] text-[#9d9b9b]">
          #{String(index + 1).padStart(2, '0')}
        </span>
        {!pick.visible && (
          <Archive className="w-4 h-4 text-[#9d9b9b]" />
        )}
      </div>

      {/* Checkbox for featured/archived status */}
      <div className="absolute top-2 left-2 z-10">
        <label className="flex items-center gap-2 px-2 py-1 bg-white/90 rounded text-xs">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              checked={isTop3}
              onChange={() => onClick()}
              className="peer h-4 w-4 shrink-0 rounded-sm border border-[#252525] bg-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#252525] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[#252525] data-[state=checked]:text-white"
            />
            {isTop3 && (
              <svg
                className="absolute left-0 top-0 h-4 w-4 stroke-white"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M12 5l-6 6-2-2"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
          <span>{isTop3 ? 'Featured' : 'Archived'}</span>
        </label>
      </div>

      <div
        className="w-full h-full bg-cover bg-center"
        style={{ backgroundImage: `url(${pick.image_url})` }}
      />

      <div className="absolute bottom-0 left-0 right-0 bg-white p-4">
        <div className="text-sm text-[#9d9b9b] mb-1">{pick.reference}</div>
        <h3 className="text-base font-medium text-[#252525] truncate">{pick.title}</h3>
      </div>
    </div>
  );
}