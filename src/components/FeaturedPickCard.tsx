import React from 'react';
import type { Pick } from '../types';
import { Heart } from 'lucide-react';

interface FeaturedPickCardProps {
  pick: Pick & {
    profile?: {
      id: string;
      full_name: string | null;
      title: string | null;
      avatar_url?: string | null;
      is_admin?: boolean;
      is_creator?: boolean;
      is_brand?: boolean;
    };
  };
  onClick?: () => void;
}

export function FeaturedPickCard({ pick, onClick }: FeaturedPickCardProps) {
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onClick) {
      onClick();
    } else {
      // Default behavior - open modal
      const currentPosition = window.scrollY;
      localStorage.setItem('discover_scroll_position', currentPosition.toString());
      
      const event = new CustomEvent('openPickModal', {
        detail: { pickId: pick.id }
      });
      window.dispatchEvent(event);
    }
  };

  return (
    <div 
      className="pick-card-container overflow-hidden cursor-pointer"
      onClick={handleClick}
    >
      {/* Image Container */}
      <div className="pick-image-container">
        <img
          src={pick.image_url}
          alt={pick.title}
          className="w-full h-full object-cover aspect-square"
        />
      </div>
      
      {/* Info Section - No Profile Info */}
      <div className="py-4 pick-card-info">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-medium text-[#252525] truncate" style={{ fontSize: '1rem' }}>
              {pick.title}
            </h3>
            <div className="uppercase text-xs font-mono text-[#9d9b9b] line-clamp-1">
              {pick.reference}
            </div>
          </div>
          <button 
            className="inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors text-gray-400 hover:text-gray-500"
            onClick={(e) => {
              e.stopPropagation();
              // Like functionality would go here
              console.log('Like pick', pick.id);
            }}
          >
            <Heart className="w-5 h-5" />
            <span className="sr-only">Save</span>
          </button>
        </div>
      </div>
    </div>
  );
}
