import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onClick) {
      onClick();
    } else {
      // Navigate to the unified detail page
              // Use the modal system instead of navigation to prevent page reload
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
      <div className="pt-4 pick-card-info">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-medium text-[#252525] dark:text-white truncate" style={{ fontSize: '1rem' }}>
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
