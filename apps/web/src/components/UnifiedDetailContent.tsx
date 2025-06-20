import { useEffect, useRef, useState } from 'react';
import { Heart, MessageSquare, ArrowLeft, ArrowRight } from 'lucide-react';
import { PickImage } from './PickImage';
import { Tag } from './ui/Tag';
import { CollectionCard } from './CollectionCard';
import type { Pick } from '../types';
import DOMPurify from 'dompurify';
import { formatDistanceToNow, format } from 'date-fns';
import './ModernScrollbar.css';
import { useAuth } from '../context/AuthContext';
import { useAuthModalStore } from '../store/authModalStore';
import { savePick, unsavePick, isPickSaved } from '../services/favoritesService';
import LexicalEditor from './LexicalEditor';

// Define Collection type locally
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

type UnifiedDetailContentProps = {
  // For picks
  pickData?: Pick | null;
  // For collections
  collectionData?: Collection | null;
  collectionPicks?: Pick[];
  curatorData?: {
    id: string;
    name: string;
    title: string;
    shelfImage?: string;
  } | null;
  curatorCollections?: Collection[];
  // Navigation props
  onNavigateNext?: () => void;
  onNavigatePrev?: () => void;
  onNavigateToCollection?: (collectionId: string) => void;
  onNavigateToPick?: (pickId: string) => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  // Context info
  currentIndex?: number;
  totalItems?: number;
  mode: 'pick' | 'collection';
};

export function UnifiedDetailContent({ 
  pickData, 
  collectionData,
  collectionPicks = [],
  curatorData,
  curatorCollections = [],
  onNavigateNext,
  onNavigatePrev,
  onNavigateToCollection,
  onNavigateToPick,
  hasNext = false,
  hasPrev = false,
  currentIndex,
  totalItems,
  mode 
}: UnifiedDetailContentProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { user } = useAuth();
  const { openModal } = useAuthModalStore();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // For swipe gesture detection
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 100;
  
  // Handle touch events for swipe detection
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && hasNext && onNavigateNext) {
      onNavigateNext();
    } else if (isRightSwipe && hasPrev && onNavigatePrev) {
      onNavigatePrev();
    }
    
    // Reset values
    touchStartX.current = null;
    touchEndX.current = null;
  };
  
  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hasPrev && onNavigatePrev) {
        onNavigatePrev();
      } else if (e.key === 'ArrowRight' && hasNext && onNavigateNext) {
        onNavigateNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasNext, hasPrev, onNavigateNext, onNavigatePrev]);
  
  // Check if the pick is saved by the user (only for pick mode)
  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!user || mode !== 'pick' || !pickData) return;
      
      try {
        const isSavedPick = await isPickSaved(pickData.id);
        setSaved(Boolean(isSavedPick));
      } catch (error) {
        console.error('Error checking saved status:', error);
        setSaved(false);
      }
    };
    
    checkSavedStatus();
  }, [user, pickData, mode]);
  
  // Handle save/unsave (only for pick mode)
  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (mode !== 'pick' || !pickData) return;
    
    if (!user) {
      openModal('signup');
      return;
    }

    // Optimistic UI update - immediately update the visual state
    const wasLiked = saved;
    setSaved(!saved);
    setLoading(true);
    
    // Update the favorites count optimistically
    const pickWithCount = pickData as any;
    const originalCount = pickWithCount.favorites_count || 0;
    if (pickWithCount.favorites_count !== undefined) {
      pickWithCount.favorites_count = wasLiked ? 
        Math.max(0, originalCount - 1) : 
        originalCount + 1;
    }

    try {
      if (wasLiked) {
        await unsavePick(pickData.id);
        console.log('Successfully unliked pick:', pickData.id);
      } else {
        await savePick(pickData.id);
        console.log('Successfully liked pick:', pickData.id);
      }
      
      // Dispatch a custom event to notify other components about the like change
      window.dispatchEvent(new CustomEvent('pickLikeChanged', { 
        detail: { pickId: pickData.id, isLiked: !wasLiked } 
      }));
      
    } catch (error) {
      console.error('Error updating save status:', error);
      // Revert optimistic updates on error
      setSaved(wasLiked);
      if (pickWithCount.favorites_count !== undefined) {
        pickWithCount.favorites_count = originalCount;
      }
    } finally {
      setLoading(false);
    }
  };

  // Render navigation arrows
  const renderNavigationArrows = () => (
    <>
      {/* Previous arrow */}
      {hasPrev && onNavigatePrev && (
        <button
          type="button"
          className="fixed left-4 top-1/2 transform -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-foreground hover:bg-background transition-colors"
          onClick={onNavigatePrev}
          aria-label="Previous"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
      )}
      
      {/* Next arrow */}
      {hasNext && onNavigateNext && (
        <button
          type="button"
          className="fixed right-4 top-1/2 transform -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-foreground hover:bg-background transition-colors"
          onClick={onNavigateNext}
          aria-label="Next"
        >
          <ArrowRight className="h-6 w-6" />
        </button>
      )}
    </>
  );

  // Render pick content
  const renderPickContent = () => {
    if (!pickData) return null;

    return (
      <div className="px-4 pb-6 pt-4">
        {/* Header with title and metadata */}
        <div className="pb-3">
          <h1 className="text-2xl font-normal text-foreground leading-tight">
            {pickData.title || ''}
          </h1>
          <div className="text-sm text-muted-foreground pt-1">
            By {pickData.reference || 'Unknown'}
          </div>
          
          {/* Navigation indicator */}
          {typeof currentIndex === 'number' && typeof totalItems === 'number' && (
            <div className="text-xs text-muted-foreground pt-1">
              {currentIndex + 1} of {totalItems}
            </div>
          )}
          
          {/* Divider */}
          <div className="h-px w-full bg-border my-3"></div>
          
          {/* Picked by section */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm uppercase text-muted-foreground font-medium">Picked by</span>
                <div className="flex items-center space-x-2">
                  {pickData.profile?.avatar_url ? (
                    <img 
                      src={pickData.profile.avatar_url} 
                      alt={pickData.profile.full_name || ''}
                      className="h-6 w-6 rounded-full object-cover" 
                    />
                  ) : null}
                  <span className="text-sm font-medium text-foreground">
                    {pickData.profile?.full_name || 'Anonymous'}
                  </span>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(
                  new Date(
                    pickData.updated_at && new Date(pickData.updated_at) > new Date(pickData.created_at)
                      ? pickData.updated_at
                      : pickData.created_at
                  ), 
                  { addSuffix: true }
                )}
              </span>
            </div>
          </div>
          
          {/* Divider line */}
          <div className="h-px w-full bg-border my-3"></div>
          
          {/* Tags */}
          {(pickData as any)?.tags && (pickData as any).tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {(pickData as any).tags.map((tag: string, index: number) => (
                <Tag 
                  key={`tag-${index}`}
                  variant="default"
                  size="md"
                >
                  {tag}
                </Tag>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex flex-col relative pb-16">
          {/* Image */}
          <div className="rounded-lg overflow-hidden">
            <div className="pick-image-container-no-ratio">
              <PickImage
                src={pickData.image_url || ''}
                alt={pickData.title || ''}
                aspectRatio="auto"
                className="w-full h-auto object-cover"
                containerStyle={{ aspectRatio: 'auto' }}
              />
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center justify-between py-4 mb-6 border-b border-border bg-background px-0">
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleSave}
                disabled={loading}
                className={`flex items-center space-x-1 ${saved ? 'text-red-500' : 'text-muted-foreground'} hover:text-foreground transition-colors`}
              >
                <Heart className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
                <span className="text-sm">{saved ? 'Liked' : 'Like'}</span>
                {(pickData as any)?.favorites_count > 0 && (
                  <span className="text-xs ml-1">({(pickData as any)?.favorites_count})</span>
                )}
              </button>
              <button className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors">
                <MessageSquare className="w-5 h-5" />
                <span className="text-sm">Comment</span>
              </button>
            </div>
            <div>
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Share
              </button>
            </div>
          </div>
          
          {/* Your Story */}
          {pickData.description && (
            <div className="mb-4">
              <h3 className="text-muted-foreground uppercase text-sm font-medium font-mono">YOUR STORY</h3>
              <div 
                className="text-foreground text-base md:text-lg leading-relaxed mt-3"
                dangerouslySetInnerHTML={{ 
                  __html: pickData.description.trim().startsWith('{')
                    ? DOMPurify.sanitize((LexicalEditor as any).jsonToHtml(pickData.description))
                    : DOMPurify.sanitize(pickData.description)
                }}
              />
            </div>
          )}
          
          {/* Why section */}
          {(pickData as any)?.why && (
            <div className="mb-4">
              <h3 className="text-muted-foreground uppercase text-sm font-medium font-mono">WHY I PICKED THIS</h3>
              <div 
                className="text-foreground text-base md:text-lg leading-relaxed mt-3"
                dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize((pickData as any).why) 
                }}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render collection content
  const renderCollectionContent = () => {
    if (!collectionData) return null;

    return (
      <div className="px-4 pb-6 pt-4">
        {/* Header */}
        <div className="pb-3">
          <h1 className="text-2xl font-normal text-foreground leading-tight">
            {collectionData.title || ''}
          </h1>
          <div className="text-sm text-muted-foreground pt-1">
            {collectionData.description || ''}
          </div>
          
          {/* Navigation indicator */}
          {typeof currentIndex === 'number' && typeof totalItems === 'number' && (
            <div className="text-xs text-muted-foreground pt-1">
              {currentIndex + 1} of {totalItems}
            </div>
          )}
          
          {/* Divider */}
          <div className="h-px w-full bg-border my-3"></div>
          
          {/* Curated by section */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm uppercase text-muted-foreground font-medium">Curated by</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-foreground">
                    {curatorData?.name || 'Anonymous'}
                  </span>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">
                {format(new Date(collectionData.created_at), 'dd. MM. yyyy')}
              </span>
            </div>
          </div>
          
          {/* Divider line */}
          <div className="h-px w-full bg-border my-3"></div>
          
          {/* Categories */}
          {collectionData.categories && collectionData.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {collectionData.categories.map((category: string, index: number) => (
                <Tag 
                  key={`category-${index}`}
                  variant="default"
                  size="md"
                >
                  {category}
                </Tag>
              ))}
            </div>
          )}
        </div>
        
        {/* Collection cover image */}
        {collectionData.cover_image && (
          <div className="rounded-lg overflow-hidden mb-6">
            <img
              src={collectionData.cover_image}
              alt={collectionData.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex items-center justify-between py-4 mb-6 border-b border-border bg-background px-0">
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors">
              <Heart className="w-5 h-5" />
              <span className="text-sm">Like</span>
            </button>
            <button className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors">
              <MessageSquare className="w-5 h-5" />
              <span className="text-sm">Comment</span>
            </button>
          </div>
          <div>
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Share
            </button>
          </div>
        </div>
        
        {/* Collection picks */}
        {collectionPicks.length > 0 && (
          <div className="mb-4">
            <h3 className="text-muted-foreground uppercase text-sm font-medium font-mono">PICKS ({collectionPicks.length})</h3>
            
            {/* Picks grid */}
            <div className="grid grid-cols-2 gap-2 mt-3 mb-4">
              {collectionPicks.slice(0, 6).map((pick) => (
                <div 
                  key={pick.id} 
                  className="aspect-square bg-muted rounded overflow-hidden cursor-pointer" 
                  onClick={() => onNavigateToPick?.(pick.id)}
                >
                  {pick.image_url ? (
                    <img 
                      src={pick.image_url} 
                      alt={pick.title} 
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-sm">
                      No image
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Picks list */}
            <div className="font-mono">
              {collectionPicks.map((pick, index) => (
                <div 
                  key={pick.id} 
                  className="py-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-muted/50"
                  onClick={() => onNavigateToPick?.(pick.id)}
                >
                  <div className="grid grid-cols-12 items-center gap-2">
                    <div className="text-sm col-span-1 text-foreground">#{String(index + 1).padStart(2, '0')}</div>
                    <div className="text-sm font-medium col-span-5 truncate text-foreground">{pick.title}</div>
                    <div className="text-sm text-muted-foreground col-span-6 truncate">{pick.reference}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Other collections by curator - Only show when in collection mode */}
        {mode === 'collection' && curatorCollections.length > 0 && (
          <div className="mb-4">
            <h3 className="text-muted-foreground uppercase text-sm font-medium font-mono">MORE BY {curatorData?.name?.toUpperCase()}</h3>
            <div className="grid grid-cols-1 gap-3 mt-3">
              {curatorCollections
                .filter(c => c.id !== collectionData.id)
                .slice(0, 3)
                .map((collection, index) => (
                <div 
                  key={collection.id}
                  className="cursor-pointer"
                  onClick={() => onNavigateToCollection?.(collection.id)}
                >
                  <CollectionCard 
                    collection={collection} 
                    linkWrapper={false}
                    issueNumber={String(index + 1).padStart(2, '0')}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className="min-h-screen bg-background modern-scrollbar overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Navigation arrows */}
      {!isMobile && renderNavigationArrows()}
      
      {isMobile ? (
        // Mobile full-screen layout
        <div className="w-full">
          {mode === 'pick' ? renderPickContent() : renderCollectionContent()}
        </div>
      ) : (
        // Desktop 2-column layout
        <div className="max-w-[100rem] mx-auto p-8">
          <div className="flex flex-col lg:flex-row gap-16">
            {/* Left Column: Main content */}
            <div className="lg:w-1/2">
              {mode === 'pick' ? renderPickContent() : renderCollectionContent()}
            </div>
            
            {/* Right Column: Metadata and related content */}
            <div className="lg:w-1/2">
              {mode === 'pick' && pickData && (
                <div className="space-y-6">
                  {/* Pick metadata */}
                  <div className="w-full font-mono text-sm">
                    <div className="flex justify-between py-3 border-b border-border">
                      <div className="text-muted-foreground">CATEGORY</div>
                      <div className="text-foreground">{pickData.category}</div>
                    </div>
                    <div className="flex justify-between py-3 border-b border-border">
                      <div className="text-muted-foreground">DATE</div>
                      <div className="text-foreground">{format(new Date(pickData.created_at), 'dd. MM. yyyy')}</div>
                    </div>
                    <div className="flex justify-between py-3 border-b border-border">
                      <div className="text-muted-foreground">PICKED BY</div>
                      <div className="text-foreground">{pickData.profile?.full_name || 'Anonymous'}</div>
                    </div>
                  </div>
                </div>
              )}
              
              {mode === 'collection' && collectionData && (
                <div className="space-y-6">
                  {/* Collection metadata */}
                  <div className="w-full font-mono text-sm">
                    <div className="flex justify-between py-3 border-b border-border">
                      <div className="text-muted-foreground">ISSUE#</div>
                      <div className="text-foreground">{(currentIndex || 0) + 1}</div>
                    </div>
                    <div className="flex justify-between py-3 border-b border-border">
                      <div className="text-muted-foreground">DATE</div>
                      <div className="text-foreground">{format(new Date(collectionData.created_at), 'dd. MM. yyyy')}</div>
                    </div>
                    <div className="flex justify-between py-3 border-b border-border">
                      <div className="text-muted-foreground">COLLECTED BY</div>
                      <div className="text-foreground">{curatorData?.name || 'Anonymous'}</div>
                    </div>
                    <div className="flex justify-between py-3 border-b border-border">
                      <div className="text-muted-foreground">CATEGORIES</div>
                      <div className="text-foreground">{collectionData.categories?.join(', ') || '-'}</div>
                    </div>
                    <div className="flex justify-between py-3">
                      <div className="text-muted-foreground">PICKS</div>
                      <div className="text-foreground">{collectionPicks.length}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 