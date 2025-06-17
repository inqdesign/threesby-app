import { useState } from 'react';
import { Carousel } from './ui/Carousel';
import { CarouselItem } from './ui/CarouselContent';
import { PickCard } from './PickCard';
import { FollowButton } from './FollowButton';
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
    // Navigate to the unified detail page
            // Use the modal system instead of navigation to prevent page reload
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
              // Featured Curators - custom card design with follow button
              <div className="cursor-pointer overflow-hidden pick-card-container" onClick={() => handleCuratorClick(item as Profile)}>
                {/* Profile image */}
                <div className="pick-image-container">
                  <img
                    src={(item as Profile).avatar_url || '/avatar-placeholder.png'}
                    alt={(item as Profile).full_name || 'Anonymous'}
                    className="w-full h-full object-cover aspect-square"
                  />
                </div>
                
                {/* Profile info section */}
                <div className="pt-4 pick-card-info">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-medium text-[#252525] dark:text-white truncate" style={{ fontSize: '1rem' }}>
                        {(item as Profile).full_name || 'Anonymous'}
                      </h3>
                      <div className="uppercase text-xs font-mono text-[#9d9b9b] line-clamp-1">
                        {(item as Profile).title || 'Curator'}
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <FollowButton userId={(item as Profile).id} />
                    </div>
                  </div>
                </div>
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
