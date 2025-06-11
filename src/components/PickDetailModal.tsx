import { Fragment, useEffect, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Heart, MessageSquare } from 'lucide-react';
import { PickImage } from './PickImage';
import { Tag } from './ui/Tag';
import type { Pick } from '../types';
import DOMPurify from 'dompurify';
import { formatDistanceToNow } from 'date-fns';
import './ModernScrollbar.css';
import { useAuth } from '../hooks/useAuth';
import { useAuthModalStore } from '../store/authModalStore';
import { savePick, unsavePick, isPickSaved } from '../services/favoritesService';
import LexicalEditor from './LexicalEditor';

type PickDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  pickId?: string | null;
  pickData: Pick | null;
  isLoading: boolean;
  onNavigate?: (pickId: string) => void;
};

export function PickDetailModal({ isOpen, onClose, pickData }: PickDetailModalProps) {
  const dialogPanelRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { user } = useAuth();
  const { openModal } = useAuthModalStore();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // For swipe gesture detection
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 100; // Minimum distance required for a swipe
  
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
    
    if (isLeftSwipe) {
      // User swiped from right to left, close the modal
      onClose();
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
    
    // Always check immediately, not just when modal opens
    checkMobile();
    
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Handle body scroll and focus management
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
      // Focus the dialog when opened
      setTimeout(() => {
        dialogPanelRef.current?.focus();
      }, 100);
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);
  
  // Skip loading state since we already have the data from the thumbnail
  const showContent = pickData !== null;
  
  // Check if the pick is saved by the user
  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!user || !pickData) return;
      
      try {
        const isSavedPick = await isPickSaved(pickData.id);
        setSaved(Boolean(isSavedPick));
      } catch (error) {
        console.error('Error checking saved status in modal:', error);
        setSaved(false);
      }
    };
    
    if (isOpen) {
      checkSavedStatus();
    }
  }, [user, pickData, isOpen]);
  
  // Handle save/unsave
  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      openModal('signup');
      return;
    }

    if (!pickData) return;

    setLoading(true);
    try {
      if (saved) {
        await unsavePick(pickData.id);
      } else {
        await savePick(pickData.id);
      }
      setSaved(!saved);
      
      // Update the favorites count in the UI
      const pickWithCount = pickData as any;
      if (pickWithCount.favorites_count !== undefined) {
        pickWithCount.favorites_count = saved ? 
          Math.max(0, pickWithCount.favorites_count - 1) : 
          pickWithCount.favorites_count + 1;
      }
    } catch (error) {
      console.error('Error updating save status in modal:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[10000]" onClose={onClose}>
        {/* Black overlay with fade in/out animation */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-70 transition-opacity" aria-hidden="true" />
        </Transition.Child>
        
        {isMobile ? (
          // Mobile bottom drawer layout
          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-y-full"
                enterTo="translate-y-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-y-0"
                leaveTo="translate-y-full"
              >
                <Dialog.Panel 
                  ref={dialogPanelRef}
                  tabIndex={-1}
                  className="fixed inset-x-0 bottom-0 top-0 max-h-[100vh] bg-background shadow-xl transform transition-all overflow-y-auto modern-scrollbar focus:outline-none"
                  style={{ scrollBehavior: 'smooth', paddingTop: '1rem' }}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {/* Swipe indicator removed as requested */}
                  
                  {/* Close button - top right */}
                  <div className="absolute right-4 top-4 z-10">
                    <button
                      type="button"
                      className="w-10 h-10 min-w-[2.5rem] min-h-[2.5rem] aspect-square rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                      onClick={onClose}
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="px-4 pb-6 pt-4">
                    {/* Header with title and metadata */}
                    <div className="pb-3">
                      <h1 className="text-2xl font-normal text-foreground leading-tight">
                        {pickData?.title || ''}
                      </h1>
                      <div className="text-sm text-muted-foreground pt-1">
                        By {pickData?.reference || 'Unknown'}
                      </div>
                      
                      {/* Divider */}
                      <div className="h-px w-full bg-border my-3"></div>
                      
                      {/* Picked by section - In a single row */}
                      <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm uppercase text-muted-foreground font-medium">Picked by</span>
                            <div className="flex items-center space-x-2">
                              {pickData?.profile?.avatar_url ? (
                                <img 
                                  src={pickData.profile.avatar_url} 
                                  alt={pickData.profile.full_name || ''}
                                  className="h-6 w-6 rounded-full object-cover" 
                                />
                              ) : null}
                              <span className="text-sm font-medium text-foreground">
                                {pickData?.profile?.full_name || 'Anonymous'}
                              </span>
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {pickData ? formatDistanceToNow(
                              // Use the most recent date between updated_at and created_at
                              new Date(
                                pickData.updated_at && new Date(pickData.updated_at) > new Date(pickData.created_at)
                                  ? pickData.updated_at
                                  : pickData.created_at
                              ), 
                              { addSuffix: true }
                            ) : ''}
                          </span>
                        </div>
                      </div>
                      
                      {/* Divider line between Picked by section and tags */}
                      <div className="h-px w-full bg-border my-3"></div>
                      
                      {/* Tags - Moved inside the container as requested */}
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
                    
                    {showContent && (
                      <div className="flex flex-col relative pb-16"> {/* Added pb-16 to make room for absolute positioned buttons */}
                        
                        {/* Image - without aspect ratio */}
                        <div className="rounded-lg overflow-hidden">
                          <div className="pick-image-container-no-ratio">
                            <PickImage
                              src={pickData?.image_url || ''}
                              alt={pickData?.title || ''}
                              aspectRatio="auto"
                              className="w-full h-auto object-cover"
                              containerStyle={{ aspectRatio: 'auto' }}
                            />
                          </div>
                        </div>
                        
                        {/* Action buttons - scrolls with content */}
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
                        {pickData?.description && (
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
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        ) : (
          // Desktop centered modal layout
          <div className="fixed inset-0 overflow-y-auto z-50">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel 
                  ref={dialogPanelRef}
                  tabIndex={-1}
                  className="w-full max-w-[100rem] transform overflow-y-auto rounded-2xl bg-background p-8 text-left align-middle shadow-xl transition-all modern-scrollbar relative focus:outline-none"
                  style={{ 
                    scrollBehavior: 'smooth',
                    height: 'calc(100vh - 80px)', // 100vh minus top bar height (approx 80px)
                    maxHeight: 'calc(100vh - 80px)'
                  }}
                >
                  {/* Close button - top right */}
                  <div className="absolute right-5 top-5 z-10">
                    <button
                      type="button"
                      className="w-10 h-10 min-w-[2.5rem] min-h-[2.5rem] aspect-square rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                      onClick={onClose}
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {/* 2-Column Layout for Desktop */}
                  <div className="flex flex-col lg:flex-row gap-16">
                    {/* Left Column: Title, Reference, and Cover Image */}
                    <div className="lg:w-1/2">
                      {/* Title and Reference */}
                      <div className="mb-6">
                        <h1 className="text-2xl font-normal text-foreground leading-tight mb-2">
                          {pickData?.title || ''}
                        </h1>
                        <div className="text-sm text-muted-foreground">
                          By {pickData?.reference || 'Unknown'}
                        </div>
                      </div>
                      
                      {/* Cover Image */}
                      {showContent && (
                        <div className="rounded-lg overflow-hidden">
                          <div className="pick-image-container-no-ratio">
                            <PickImage
                              src={pickData?.image_url || ''}
                              alt={pickData?.title || ''}
                              aspectRatio="auto"
                              className="w-full h-auto object-cover"
                              containerStyle={{ aspectRatio: 'auto' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Right Column: Pick by, Time, Tags, Actions, and Story */}
                    <div className="lg:w-1/2 lg:mt-20">
                      {/* Picked by section */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm uppercase text-muted-foreground font-medium">Picked by</span>
                            <div className="flex items-center space-x-2">
                              {pickData?.profile?.avatar_url ? (
                                <img 
                                  src={pickData.profile.avatar_url} 
                                  alt={pickData.profile.full_name || ''}
                                  className="h-6 w-6 rounded-full object-cover" 
                                />
                              ) : null}
                              <span className="text-sm font-medium text-foreground">
                                {pickData?.profile?.full_name || 'Anonymous'}
                              </span>
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {pickData ? formatDistanceToNow(
                              new Date(
                                pickData.updated_at && new Date(pickData.updated_at) > new Date(pickData.created_at)
                                  ? pickData.updated_at
                                  : pickData.created_at
                              ), 
                              { addSuffix: true }
                            ) : ''}
                          </span>
                        </div>
                        
                        {/* Tags */}
                        {(pickData as any)?.tags && (pickData as any).tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-6">
                            {(pickData as any).tags.map((tag: string, index: number) => (
                              <Tag 
                                key={`tag-desktop-${index}`}
                                variant="default"
                                size="md"
                              >
                                {tag}
                              </Tag>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex items-center justify-between pb-4 mb-6 border-b border-border">
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
                      
                      {/* Story Content */}
                      <div className="space-y-6">
                        {/* Your Story */}
                        {pickData?.description && (
                          <div>
                            <h3 className="text-muted-foreground uppercase text-sm font-medium font-mono mb-3">YOUR STORY</h3>
                            <div 
                              className="text-foreground text-base leading-relaxed"
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
                          <div>
                            <h3 className="text-muted-foreground uppercase text-sm font-medium font-mono mb-3">WHY I PICKED THIS</h3>
                            <div 
                              className="text-foreground text-base leading-relaxed"
                              dangerouslySetInnerHTML={{ 
                                __html: DOMPurify.sanitize((pickData as any).why) 
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        )}
      </Dialog>
    </Transition>
  );
}

export default PickDetailModal;
