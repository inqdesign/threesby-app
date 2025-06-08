import { useState } from 'react';
import { Carousel } from './ui/Carousel';
import { CarouselItem } from './ui/CarouselContent';
import { PickCard } from './PickCard';
import { useNavigate } from 'react-router-dom';
import type { Pick, Profile } from '../types';

interface FeaturedCarouselCardProps {
  type: 'threes' | 'curators';
  title: string;
  items: (Pick | (Profile & { picks: Pick[] }))[];
  className?: string;
}

export function FeaturedCarouselCard({ type, title, items, className = '' }: FeaturedCarouselCardProps) {
  // Track the current slide index
  const [, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const handleSlideChange = (index: number) => {
    setCurrentSlide(index);
  };

  const handlePickClick = (pick: Pick) => {
    // Save current scroll position for when modal is closed
    const currentPosition = window.scrollY;
    localStorage.setItem('discover_scroll_position', currentPosition.toString());
    
    // Dispatch a custom event to open the modal
    const event = new CustomEvent('openPickModal', {
      detail: { pickId: pick.id }
    });
    window.dispatchEvent(event);
  };

  const handleCuratorClick = (curator: Profile) => {
    // Navigate to curators page and store the curator ID to scroll to
    localStorage.setItem('scroll_to_curator', curator.id);
    navigate('/curators');
  };

  return (
    <div className={`featured-carousel ${className}`}>
      <Carousel
        slides={items.map((item, index) => (
          <CarouselItem key={index}>
            {type === 'threes' ? (
              // Featured Picks - use regular PickCard design
              <PickCard
                pick={item as Pick}
                variant="feed"
                display="desktop"
                disableProfileLink={false}
                onClick={() => handlePickClick(item as Pick)}
              />
            ) : (
              // Featured Curators - use PickCard design with profile image
              <div className="cursor-pointer" onClick={() => handleCuratorClick(item as Profile)}>
                <PickCard
                  pick={{
                    id: `curator-${(item as Profile).id}`,
                    title: (item as Profile).full_name || 'Anonymous',
                    reference: (item as Profile).bio?.substring(0, 60) || 'Curator',
                    category: 'books' as 'books' | 'products' | 'places',
                    rank: 1,
                    image_url: (item as Profile).avatar_url || '/avatar-placeholder.png',
                    profile: {
                      id: (item as Profile).id,
                      full_name: (item as Profile).full_name,
                      title: (item as Profile).title,
                      avatar_url: (item as Profile).avatar_url,
                      is_admin: (item as Profile).is_admin,
                      is_creator: (item as Profile).is_creator
                    }
                  }}
                  variant="feed"
                  display="desktop"
                  disableProfileLink={false}
                  // Replace heart icon with follow button
                  customActions={
                    <button 
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium py-1 px-3 rounded transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Follow functionality would go here
                        console.log('Follow curator', (item as Profile).id);
                      }}
                    >
                      Follow
                    </button>
                  }
                />
              </div>
            )}
          </CarouselItem>
        ))}
        onSlideChange={handleSlideChange}
        showControls={true}
        showIndicators={true}
        autoPlay={true}
        interval={8000}
        className="w-full"
      />
    </div>
  );
}
