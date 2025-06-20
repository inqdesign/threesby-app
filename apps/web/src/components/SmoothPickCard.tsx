import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PickCard } from './PickCard';
import type { Pick } from '../types';

interface SmoothPickCardProps {
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
  variant?: 'feed' | 'Pick' | 'myPick';
  display?: 'desktop' | 'mobile';
}

/**
 * SmoothPickCard component that displays a pick card and opens the modal via URL
 * This ensures proper sharing capabilities while maintaining a modal experience
 */
export function SmoothPickCard({ pick, variant = 'feed', display = 'desktop' }: SmoothPickCardProps) {
  const navigate = useNavigate();
  
  // Handle click on the card
  const handleClick = (e: React.MouseEvent) => {
    // Prevent default navigation behavior
    e.preventDefault();
    e.stopPropagation();
    
    // Navigate to the unified detail page
            // Use the modal system instead of navigation to prevent page reload
        const event = new CustomEvent('openPickModal', {
          detail: { pickId: pick.id }
        });
        window.dispatchEvent(event);
  };

  return (
    <div 
      onClick={handleClick}
      className="smooth-pick-card block cursor-pointer"
    >
      <PickCard
        pick={pick}
        variant={variant}
        display={display}
        disableProfileLink={true}
      />
    </div>
  );
}
