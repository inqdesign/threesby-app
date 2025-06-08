import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Book, Package, MapPin, Check } from 'lucide-react';
import type { Pick } from '../types';

type Category = 'places' | 'products' | 'books';

interface SortableItemProps {
  id: string;
  pick?: Pick;
  category: Category;
  rank: number;
  isAddTile?: boolean;
  isEmpty?: boolean;
  isActive?: boolean;
  onPickClick: (pick: Pick, category: Category, rank: number) => void;
  onAddPick: (category: Category, rank: number) => void;
}

// Helper function to get category display name
const getCategoryDisplayName = (category: Category): string => {
  switch (category) {
    case 'books': return 'Book';
    case 'products': return 'Product';
    case 'places': return 'Place';
    default: return 'Item';
  }
};

// Sortable item component for drag and drop functionality
// Using React.memo to prevent unnecessary re-renders when modal opens/closes
export const SortableItem = React.memo(({ 
  id, 
  pick, 
  category, 
  rank, 
  isAddTile, 
  isEmpty,
  isActive = false,
  onPickClick,
  onAddPick
}: SortableItemProps) => {
  // Only make actual picks draggable, not add tiles or empty tiles
  const shouldBeDraggable = pick && !isAddTile && !isEmpty;
  
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !shouldBeDraggable
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };
  
  // Render the appropriate tile based on type
  let content;
  
  if (pick) {
    // Existing pick tile
    content = (
      <div 
        className="aspect-square cursor-pointer overflow-hidden"
        onClick={() => onPickClick(pick, category, pick.rank)}
      >
        {pick.image_url && (
          <div className="w-full h-full">
            <img 
              src={pick.image_url} 
              alt={pick.title || 'Pick image'} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="absolute top-2 right-2 text-[10px] text-[#9d9b9b]">
          #{rank}
        </div>
        {/* Title is now hidden based on user request */}
      </div>
    );
  } else if (isAddTile) {
    // Add tile - Updated design based on Image 1
    content = (
      <div 
        className="aspect-square flex flex-col items-center justify-center cursor-pointer relative bg-[#f5ffde]"
        role="button"
        tabIndex={0}
        aria-label={`Add ${getCategoryDisplayName(category)}`}
        onClick={() => onAddPick(category, rank)}
      >
        <div className="absolute top-2 right-2 z-30 text-[10px] text-[#9d9b9b] font-medium flex items-center gap-1">
          #{rank < 10 ? `0${rank}` : rank}
        </div>
        
        {/* Repositioned layout with text at bottom left and icon at bottom right */}
        <div className="flex items-end justify-between w-full h-full p-4">
          {/* Add text at the bottom left */}
          <span className="text-base text-[#252525] font-medium">
            Add
          </span>
          
          {/* Icon at the bottom right - fixed size for mobile */}
          <div className="flex items-center justify-center min-w-[24px]">
            {category === 'books' && <Book className="w-5 h-5 md:w-6 md:h-6 text-[#252525]" strokeWidth={1.5} />}
            {category === 'products' && <Package className="w-5 h-5 md:w-6 md:h-6 text-[#252525]" strokeWidth={1.5} />}
            {category === 'places' && <MapPin className="w-5 h-5 md:w-6 md:h-6 text-[#252525]" strokeWidth={1.5} />}
          </div>
        </div>
      </div>
    );
  } else {
    // Empty tile - Updated design based on Image 2, with layout matching Add tile (non-clickable)
    content = (
      <div 
        className="aspect-square rounded-[4px] bg-[#f8f8f6] border border-[#e0e0e0] relative"
        aria-label={`Empty slot ${rank}`}
      >
        {/* Repositioned layout with empty text area at bottom left and icon at bottom right */}
        <div className="flex items-end justify-between w-full h-full p-4">
          {/* Empty text area at the bottom left */}
          <span className="text-base text-[#cccccc] font-medium">
            &nbsp;
          </span>
          
          {/* Icon at the bottom right - fixed size for mobile */}
          <div className="flex items-center justify-center min-w-[24px]">
            {category === 'places' && <MapPin className="w-5 h-5 md:w-6 md:h-6 text-[#cccccc]" strokeWidth={1.5} />}
            {category === 'products' && <Package className="w-5 h-5 md:w-6 md:h-6 text-[#cccccc]" strokeWidth={1.5} />}
            {category === 'books' && <Book className="w-5 h-5 md:w-6 md:h-6 text-[#cccccc]" strokeWidth={1.5} />}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Drag handle for draggable items */}
      {shouldBeDraggable && (
        <div 
          className="absolute top-0 left-0 right-0 h-8 z-10 cursor-grab flex justify-center items-center mb-2" 
          {...attributes} 
          {...listeners}
          data-component-name="<div />"
        >
          <div className="w-10 h-1.5 bg-gray-300 rounded-full opacity-50 hover:opacity-100 transition-opacity"></div>
        </div>
      )}
      
      {/* Badge for top 3 picks - only shown for non-active users */}
      {pick && [1, 2, 3].includes(pick.rank) && !isActive && (
        <div className="absolute top-2 right-2 z-30 bg-[#a1ff7a] w-6 h-6 rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-black" />
        </div>
      )}
      
      {content}
    </div>
  );
});

SortableItem.displayName = 'SortableItem';
