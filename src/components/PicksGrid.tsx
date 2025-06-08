import { useMemo } from 'react';
import { Book, Package, MapPin } from 'lucide-react';
import { PickCard } from './PickCard';
import { SmoothPickCard } from './SmoothPickCard';
import type { Pick } from '../types';

interface PicksGridProps {
  picks: Pick[];
  onPickClick?: (pick: Pick) => void;
  gap?: string; // Optional gap size between items, default is 10px
}

export function PicksGrid({
  picks,
  onPickClick,
  gap = '10px',
}: PicksGridProps) {
  // Only log in development environment and only when needed
  if (import.meta.env.DEV && picks?.length === 0) {
    console.log('PicksGrid: No picks available');
  }
  
  // Check if picks is undefined or empty
  if (!picks || picks.length === 0) {
    // Return empty placeholders for all 9 positions
    return (
      <div className={`grid grid-cols-3 gap-[${gap}]`}>
        {Array.from({ length: 9 }).map((_, index) => {
          // Determine which category icon to show based on the position
          let CategoryIcon;
          if (index < 3) {
            CategoryIcon = Book;
          } else if (index < 6) {
            CategoryIcon = Package;
          } else {
            CategoryIcon = MapPin;
          }
          
          return (
            <div key={`empty-${index}`} className="relative">
              <div className="aspect-square rounded-[4px] bg-gray-50 border border-gray-100 relative">
                <div className="absolute bottom-2 right-2 text-gray-300">
                  <CategoryIcon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  
  // Memoize the filtered and sorted picks to avoid recalculating on every render
  const { bookPicks, productPicks, placePicks } = useMemo(() => {
    // Helper function for sorting by rank
    const sortByRank = (a: Pick, b: Pick) => {
      const rankA = a.rank !== undefined && a.rank !== null ? a.rank : 999;
      const rankB = b.rank !== undefined && b.rank !== null ? b.rank : 999;
      return rankA - rankB;
    };
    
    // Filter and sort picks by category
    return {
      bookPicks: picks
        .filter(pick => pick.category === 'books')
        .sort(sortByRank)
        .slice(0, 3),
        
      productPicks: picks
        .filter(pick => pick.category === 'products')
        .sort(sortByRank)
        .slice(0, 3),
        
      placePicks: picks
        .filter(pick => pick.category === 'places')
        .sort(sortByRank)
        .slice(0, 3)
    };
  }, [picks]); // Only recalculate when picks array changes
  
  // Handle click on a pick - dispatch custom event to open modal
  const handlePickClick = (pick: Pick) => {
    if (onPickClick) {
      // Use custom click handler if provided
      onPickClick(pick);
    } else if (pick.id && pick.id !== 'new' && typeof pick.id === 'string' && pick.id.trim() !== '') {
      // Validate ID is a proper UUID before dispatching event
      try {
        // Dispatch a custom event to open the modal
        const event = new CustomEvent('openPickModal', {
          detail: { pickId: pick.id }
        });
        window.dispatchEvent(event);
      } catch (error) {
        console.error('Error handling pick click:', error);
      }
    }
  };

  // Memoize the combined picks array
  const allTopPicks = useMemo(() => [
    ...bookPicks,
    ...productPicks,
    ...placePicks
  ], [bookPicks, productPicks, placePicks]);
  
  return (
    <div className={`grid grid-cols-3 gap-[1px] md:gap-6`} data-component-name="PicksGrid">
      {/* Render all 9 picks in a single grid */}
      {allTopPicks.map((pick) => (
        <div key={`${pick.category}-${pick.id}`} className="relative picks-grid-item">
          {onPickClick ? (
            <>
              {/* Use different display modes based on screen size */}
              <div className="hidden md:block">
                <PickCard
                  pick={pick}
                  onClick={() => handlePickClick(pick)}
                  display="desktop"
                />
              </div>
              <div className="block md:hidden">
                <PickCard
                  pick={pick}
                  onClick={() => handlePickClick(pick)}
                  display="mobile"
                  className="!p-0 !flex-col !items-stretch !gap-0"
                />
              </div>
            </>
          ) : (
            <>
              <div className="hidden md:block">
                <SmoothPickCard
                  pick={pick}
                  variant="feed"
                />
              </div>
              <div className="block md:hidden">
                <div 
                  className="aspect-[3/4] overflow-hidden cursor-pointer"
                  onClick={() => handlePickClick(pick)}
                >
                  <img 
                    src={pick.image_url || ''} 
                    alt={pick.title || 'Pick'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.src = 'https://placehold.co/400x400/e2e8f0/64748b?text=No+Image';
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      ))}
      
      {/* Fill empty slots if needed */}
      {Array.from({ length: Math.max(0, 9 - allTopPicks.length) }).map((_, index) => {
        // Determine which category icon to show based on the position
        let CategoryIcon;
        if (index < 3 - bookPicks.length) {
          CategoryIcon = Book;
        } else if (index < (3 - bookPicks.length) + (3 - productPicks.length)) {
          CategoryIcon = Package;
        } else {
          CategoryIcon = MapPin;
        }
        
        return (
          <div key={`empty-${index}`} className="relative">
            <div className="aspect-square rounded-[4px] bg-gray-50 border border-gray-100 relative">
              <div className="absolute bottom-2 right-2 text-gray-300">
                <CategoryIcon className="w-5 h-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
