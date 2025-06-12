
import { useState, useEffect, memo } from 'react';

// Define Collection type locally until it's properly exported from types
type Collection = {
  id: string;
  profile_id: string;
  title: string;
  description: string;
  categories: string[];
  picks: string[];
  cover_image?: string;
  font_color?: 'dark' | 'light';
  created_at: string;
  updated_at: string;
  profiles?: any;
};

interface CollectionCardProps {
  collection: Collection;
  linkWrapper?: boolean; // Whether to wrap the card in a Link component (default: true)
  issueNumber?: string; // Optional prop for custom issue number (default: derived from ID)
  isActive?: boolean; // Whether this card is the active/selected card
}

export const CollectionCard = memo(function CollectionCard({ 
  collection, 
  linkWrapper = true, 
  issueNumber,
  isActive = false
}: CollectionCardProps) {
  // We're no longer using the darkFont prop as we're using a dark overlay with white text
  // for a consistent look across all collection cards
  
  // State for cover image (from database or localStorage)
  const [coverImage, setCoverImage] = useState<string | undefined>(collection.cover_image);
  
  // Try to get cover image from localStorage if not available in collection object
  useEffect(() => {
    if (!coverImage && collection.id) {
      try {
        const storedCoverImage = localStorage.getItem(`collection_cover_${collection.id}`);
        if (storedCoverImage) {
          setCoverImage(storedCoverImage);
        }
      } catch (e) {
        console.log('Failed to retrieve cover image from localStorage', e);
      }
    }
  }, [collection.id, coverImage]);
  
  // Generate a placeholder image if no cover image is available
  const getPlaceholderImage = () => {
    if (collection.title) {
      const initials = collection.title.split(' ')
        .map(word => word[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
      return `https://placehold.co/400x300/f3f2ed/9d9b9d?text=${initials}`;
    }
    return 'https://placehold.co/400x300/f3f2ed/9d9b9d?text=Collection';
  };
  
  // Card content without the Link wrapper
  const cardContent = (
    <div className="relative overflow-hidden rounded-lg bg-[#f8f8f8] w-full aspect-[5/7] group">
      {/* Background image */}
      <img 
        src={coverImage || getPlaceholderImage()} 
        alt={collection.title}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).src = getPlaceholderImage();
        }}
      />
      
      {/* Dark overlay - 50% opacity by default, 0% when selected/active */}
      <div className={`absolute inset-0 bg-black transition-opacity duration-300 ${isActive ? 'opacity-0' : 'opacity-50 group-hover:opacity-0'} z-10`}></div>
      
      {/* Issue number - top left with same padding as title */}
      <div className={`absolute top-0 left-0 right-0 p-3 transition-opacity duration-300 ${isActive ? 'opacity-0' : 'group-hover:opacity-0'} z-20`}>
        <span className="text-[10px] font-medium text-[#FFFFFF] text-left block">
          ISSUE #{issueNumber || '01'}
        </span>
      </div>
      
      {/* Collection title - bold at bottom */}
      <div className={`absolute bottom-0 left-0 right-0 p-3 transition-opacity duration-300 ${isActive ? 'opacity-0' : 'group-hover:opacity-0'} z-20`}>
        <h3 className="text-[#FFFFFF] font-bold text-base leading-[1] text-left">
          {collection.title.toUpperCase()}
        </h3>
      </div>
    </div>
  );
  
  // Return the card with or without the Link wrapper based on the linkWrapper prop
  return linkWrapper ? (
    <div 
      className="block w-full group cursor-pointer"
      onClick={() => {
        // Use the modal system instead of navigation to prevent page reload
        console.log('🚀 DISPATCHING openCollectionModal EVENT for ID:', collection.id);
        const event = new CustomEvent('openCollectionModal', {
          detail: { collectionId: collection.id }
        });
        window.dispatchEvent(event);
        console.log('🚀 EVENT DISPATCHED');
      }}
    >
      {cardContent}
    </div>
  ) : (
    cardContent
  );
});

export default CollectionCard;
