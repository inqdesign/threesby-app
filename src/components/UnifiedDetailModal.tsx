import { Fragment, useEffect, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Heart, ArrowLeft, ArrowRight, MessageCircle, Share2 } from 'lucide-react';
import { PickImage } from './PickImage';
import { CollectionCard } from './CollectionCard';
import { Tag } from './ui/Tag';
import type { Pick } from '../types';
import DOMPurify from 'dompurify';
import { format } from 'date-fns';
import './ModernScrollbar.css';
import { useAuth } from '../hooks/useAuth';
import { useAuthModalStore } from '../store/authModalStore';
import { savePick, unsavePick, isPickSaved } from '../services/favoritesService';
import LexicalEditor from './LexicalEditor';
import { supabase } from '../lib/supabase';

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

type UnifiedDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  // Initial data
  initialPickData?: Pick | null;
  initialCollectionData?: Collection | null;
  initialCollectionPicks?: Pick[];
  initialCuratorData?: {
    id: string;
    name: string;
    title: string;
    shelfImage?: string;
  } | null;
  initialCuratorCollections?: Collection[];
  initialCuratorPicks?: Pick[];
  // Navigation props
  onNavigateNext?: () => void;
  onNavigatePrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  // Context info
  currentIndex?: number;
  totalItems?: number;
  initialMode: 'pick' | 'collection';
};

export function UnifiedDetailModal({ 
  isOpen, 
  onClose, 
  initialPickData, 
  initialCollectionData,
  initialCollectionPicks = [],
  initialCuratorData,
  initialCuratorCollections = [],
  initialCuratorPicks = [],
  onNavigateNext,
  onNavigatePrev,
  hasNext = false,
  hasPrev = false,
  currentIndex,
  totalItems,
  initialMode
}: UnifiedDetailModalProps) {
  
  // Debug: Log what data the modal is receiving
  console.log('UnifiedDetailModal received data:', {
    mode: initialMode,
    collectionData: initialCollectionData,
    collectionPicks: initialCollectionPicks,
    curatorData: initialCuratorData,
    curatorCollections: initialCuratorCollections
  });
  // State for tracking internal navigation and original URL
  const [mode, setMode] = useState<'pick' | 'collection'>(initialMode);
  const [pickData, setPickData] = useState<Pick | null>(initialPickData || null);
  const [collectionData, setCollectionData] = useState<Collection | null>(initialCollectionData || null);
  const [collectionPicks, setCollectionPicks] = useState<Pick[]>(initialCollectionPicks);
  const [curatorData, setCuratorData] = useState(initialCuratorData);
  const [curatorCollections, setCuratorCollections] = useState<Collection[]>(initialCuratorCollections);
  const [curatorPicks, setCuratorPicks] = useState<Pick[]>(initialCuratorPicks);
  const [originalUrl, setOriginalUrl] = useState<string>('');
  
  // Cache for curator-specific content to avoid refetching
  const [curatorDataCache, setCuratorDataCache] = useState<Map<string, {
    curatorInfo: any;
    curatorPicks: Pick[];
    curatorCollections: Collection[];
  }>>(new Map());
  
  // Breadcrumb state for collection → pick navigation
  const [breadcrumbCollection, setBreadcrumbCollection] = useState<Collection | null>(null);
  
  const dialogPanelRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { user } = useAuth();
  const { openModal } = useAuthModalStore();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // More granular loading states for better UX
  const [loadingStates, setLoadingStates] = useState({
    mainContent: false,
    sidebarInfo: false,
    relatedContent: false,
    pickDetails: false // New: specific to just the pick details
  });
  
  // Simple close handler that always closes the modal
  const handleClose = (e?: React.MouseEvent) => {
    // Prevent any event bubbling that might interfere
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('UnifiedDetailModal: Closing modal');
    
    // Simply close the modal without changing the URL
    // This ensures the original page remains visible in the background
    setBreadcrumbCollection(null); // Clear any breadcrumb state
    
    // Reset any internal navigation state
    setMode(initialMode);
    setOriginalUrl(''); // Clear the stored URL
    
    // Force close the modal
    onClose();
  };
  
  // Skeleton loading component
  const SkeletonLoader = ({ className = "", variant = "text" }: { className?: string, variant?: "text" | "image" | "button" }) => (
    <div 
      className={`animate-pulse bg-muted rounded ${
        variant === "text" ? "h-4" : 
        variant === "image" ? "aspect-square" : 
        "h-10"
      } ${className}`} 
    />
  );

  // Internal data fetching functions
  const fetchPickData = async (pickId: string) => {
    // Only show loading for pick details, keep sidebar stable if same curator
    setLoadingStates(prev => ({ ...prev, pickDetails: true }));
    
    try {
      const { data, error } = await supabase
        .from('picks')
        .select(`
          *,
          favorites_count,
          profile:profiles(*)
        `)
        .eq('id', pickId)
        .single();

      if (error) throw error;

      const profileId = data.profile_id;
      const currentCuratorId = curatorData?.id;
      const isSameCurator = currentCuratorId === profileId;
      
      // Update pick data immediately
      setPickData(data);
      setMode('pick');
      
      // Clear pick details loading quickly for immediate feedback
      setLoadingStates(prev => ({ ...prev, pickDetails: false }));

      // Only update sidebar and related content if it's a different curator
      if (!isSameCurator) {
        setLoadingStates(prev => ({ ...prev, sidebarInfo: true, relatedContent: true }));
        
        // Check cache first for curator data
        const cachedData = curatorDataCache.get(profileId);
        
        if (cachedData) {
          // Use cached data for instant loading - but ensure current pick is included
          setCuratorData(cachedData.curatorInfo);
          
          // Check if current pick is in cached picks, if not add it
          const cachedPicks = cachedData.curatorPicks;
          const currentPickInCached = cachedPicks.some(pick => pick.id === pickId);
          const finalCuratorPicks = currentPickInCached ? cachedPicks : [data, ...cachedPicks];
          
          setCuratorPicks(finalCuratorPicks);
          setCuratorCollections(cachedData.curatorCollections);
          setLoadingStates(prev => ({ ...prev, sidebarInfo: false, relatedContent: false }));
        } else {
          // Fetch and cache curator data
          if (data.profile) {
            const newCuratorData = {
              id: data.profile_id,
              name: data.profile.full_name || 'Unknown',
              title: data.profile.title || '',
              shelfImage: data.profile.shelf_image_url
            };
            setCuratorData(newCuratorData);
            setLoadingStates(prev => ({ ...prev, sidebarInfo: false }));

            if (data.profile_id) {
              // Fetch curator content in parallel for better performance
              // First, get the top 3 ranked picks
              const [curatorPicksResponse, curatorCollectionsResponse] = await Promise.all([
                supabase
                  .from('picks')
                  .select('*')
                  .eq('profile_id', data.profile_id)
                  .gte('rank', 1)
                  .lte('rank', 3)
                  .order('rank', { ascending: true }),
                supabase
                  .from('collections')
                  .select('*')
                  .eq('profile_id', data.profile_id)
                  .order('created_at', { ascending: false })
                  .limit(6)
              ]);

              // Check if current pick is already in the top 3 ranked picks
              const topRankedPicks = curatorPicksResponse.data || [];
              const currentPickInTopRanked = topRankedPicks.some(pick => pick.id === pickId);
              
              // If current pick is not in top 3, fetch it separately and include it
              let allCuratorPicks = topRankedPicks;
              if (!currentPickInTopRanked) {
                // The current pick should already be in `data`, so just add it to the list
                allCuratorPicks = [data, ...topRankedPicks];
              }

              let curatorPicksData: Pick[] = [];
              if (allCuratorPicks && allCuratorPicks.length > 0) {
                // DON'T filter out current pick - keep all picks and highlight the selected one
                curatorPicksData = allCuratorPicks.sort((a, b) => {
                  const categoryOrder = { books: 0, places: 1, products: 2 };
                  const aCategoryOrder = categoryOrder[a.category as keyof typeof categoryOrder] ?? 3;
                  const bCategoryOrder = categoryOrder[b.category as keyof typeof categoryOrder] ?? 3;
                  
                  if (aCategoryOrder !== bCategoryOrder) {
                    return aCategoryOrder - bCategoryOrder;
                  }
                  return a.rank - b.rank;
                });
              }

              const curatorCollectionsData = curatorCollectionsResponse.data || [];
              
              // Update state
              setCuratorPicks(curatorPicksData);
              setCuratorCollections(curatorCollectionsData);
              
              // Cache the data for future use (cache the original top-ranked picks only)
              setCuratorDataCache(prev => new Map(prev.set(profileId, {
                curatorInfo: newCuratorData,
                curatorPicks: topRankedPicks,
                curatorCollections: curatorCollectionsData
              })));
              
              setLoadingStates(prev => ({ ...prev, relatedContent: false }));
            }
          }
        }
      }
      // For same curator, don't modify the curator picks at all to prevent grid changes
      // Also preserve collectionPicks and breadcrumbCollection when navigating within the same context

    } catch (error) {
      console.error('Error fetching pick:', error);
      setLoadingStates({ mainContent: false, sidebarInfo: false, relatedContent: false, pickDetails: false });
    }
  };

  const fetchCollectionData = async (collectionId: string) => {
    setLoadingStates(prev => ({ ...prev, mainContent: true, sidebarInfo: true }));
    try {
      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          profiles(*)
        `)
        .eq('id', collectionId)
        .single();

      if (error) throw error;

      setCollectionData(data);
      setMode('collection');
      
      // Clear main content loading first
      setLoadingStates(prev => ({ ...prev, mainContent: false }));

      // Only fetch curator data if it's a different curator to avoid sidebar reloading
      if (data.profiles && (!curatorData || curatorData.id !== data.profile_id)) {
        setCuratorData({
          id: data.profile_id,
          name: data.profiles.full_name || 'Unknown',
          title: data.profiles.title || '',
          shelfImage: data.profiles.shelf_image_url
        });
        
        // Load related content in background
        setLoadingStates(prev => ({ ...prev, relatedContent: true }));

        // Use Promise.all for parallel fetching to improve performance
        const [curatorCollectionsResponse, curatorPicksResponse] = await Promise.all([
          supabase
            .from('collections')
            .select('*')
            .eq('profile_id', data.profile_id)
            .neq('id', collectionId)
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('picks')
            .select('*')
            .eq('profile_id', data.profile_id)
            .gte('rank', 1)
            .lte('rank', 3)
            .order('rank', { ascending: true })
        ]);

        if (curatorCollectionsResponse.data) {
          setCuratorCollections(curatorCollectionsResponse.data);
        }

        if (curatorPicksResponse.data && curatorPicksResponse.data.length > 0) {
          // Sort by category order (books, places, products) then by rank
          const sortedPicks = curatorPicksResponse.data.sort((a, b) => {
            const categoryOrder = { books: 0, places: 1, products: 2 };
            const aCategoryOrder = categoryOrder[a.category as keyof typeof categoryOrder] ?? 3;
            const bCategoryOrder = categoryOrder[b.category as keyof typeof categoryOrder] ?? 3;
            
            if (aCategoryOrder !== bCategoryOrder) {
              return aCategoryOrder - bCategoryOrder;
            }
            
            // Then by rank within category
            return a.rank - b.rank;
          });
          
          setCuratorPicks(sortedPicks);
        }
        
        setLoadingStates(prev => ({ ...prev, relatedContent: false }));
      }
      
      // Clear sidebar loading
      setLoadingStates(prev => ({ ...prev, sidebarInfo: false }));

      // Always fetch picks in this collection (they change per collection)
      if (data.picks && data.picks.length > 0) {
        const { data: picksData, error: picksError } = await supabase
          .from('picks')
          .select('*')
          .in('id', data.picks);

        if (picksError) {
          throw picksError;
        }
        
        setCollectionPicks(picksData || []);
      } else {
        setCollectionPicks([]); // Clear picks if collection has none
      }

    } catch (error) {
      console.error('Error fetching collection:', error);
      setLoadingStates({ mainContent: false, sidebarInfo: false, relatedContent: false, pickDetails: false });
    }
  };

  // Initialize state with initial data and capture original URL
  useEffect(() => {
    if (isOpen && !originalUrl) {
      // Capture the original URL when modal first opens
      setOriginalUrl(window.location.href);
    }
    
    if (initialPickData) {
      setPickData(initialPickData);
      setMode('pick');
    }
    if (initialCollectionData) {
      setCollectionData(initialCollectionData);
      setMode('collection');
    }
    if (initialCollectionPicks) {
      setCollectionPicks(initialCollectionPicks);
    }
    if (initialCuratorData) {
      setCuratorData(initialCuratorData);
    }
    if (initialCuratorCollections) {
      setCuratorCollections(initialCuratorCollections);
    }
    if (initialCuratorPicks) {
      setCuratorPicks(initialCuratorPicks);
    }
  }, [isOpen, originalUrl, initialPickData, initialCollectionData, initialCollectionPicks, initialCuratorData, initialCuratorCollections, initialCuratorPicks]);

  // Fetch curator picks if we have pick data but no curator picks
  // BUT ONLY if we're NOT in a collection context (i.e., standalone pick view)
  useEffect(() => {
    const fetchCuratorPicksIfNeeded = async () => {
      // Only fetch curator picks if:
      // 1. Modal is open and in pick mode
      // 2. We have pick data with profile_id
      // 3. We don't have curator picks yet
      // 4. We're NOT in collection context (no breadcrumb collection and no collection picks)
      const isStandalonePick = !breadcrumbCollection && (!collectionPicks || collectionPicks.length === 0);
      
      if (isOpen && mode === 'pick' && pickData && (!curatorPicks || curatorPicks.length === 0) && pickData.profile_id && isStandalonePick) {
        console.log('Fetching curator picks for standalone pick view, profile_id:', pickData.profile_id);
        
        setLoadingStates(prev => ({ ...prev, relatedContent: true }));
        
        try {
          // Fetch only the top picks (ranks 1-3) from the same curator
          const { data: topRankedPicks, error: curatorPicksError } = await supabase
            .from('picks')
            .select('*')
            .eq('profile_id', pickData.profile_id)
            .gte('rank', 1)
            .lte('rank', 3)
            .order('rank', { ascending: true });
            
          console.log('Top ranked picks:', topRankedPicks);
          console.log('Curator picks error:', curatorPicksError);

          if (topRankedPicks && topRankedPicks.length > 0) {
            // Check if current pick is already in the top 3 ranked picks
            const currentPickInTopRanked = topRankedPicks.some(pick => pick.id === pickData.id);
            
            // If current pick is not in top 3, add it to the list
            let allCuratorPicks = topRankedPicks;
            if (!currentPickInTopRanked) {
              allCuratorPicks = [pickData, ...topRankedPicks];
            }
            
            // Sort by category order (books, places, products) then by rank
            const sortedPicks = allCuratorPicks.sort((a, b) => {
              const categoryOrder = { books: 0, places: 1, products: 2 };
              const aCategoryOrder = categoryOrder[a.category as keyof typeof categoryOrder] ?? 3;
              const bCategoryOrder = categoryOrder[b.category as keyof typeof categoryOrder] ?? 3;
              
              if (aCategoryOrder !== bCategoryOrder) {
                return aCategoryOrder - bCategoryOrder;
              }
              
              // Then by rank within category
              return a.rank - b.rank;
            });
            
            console.log('Final curator picks including current:', sortedPicks);
            setCuratorPicks(sortedPicks);
          }
        } catch (error) {
          console.error('Error fetching curator picks:', error);
        } finally {
          setLoadingStates(prev => ({ ...prev, relatedContent: false }));
        }
      } else if (!isStandalonePick) {
        console.log('Skipping curator picks fetch - in collection context');
      }
    };

    fetchCuratorPicksIfNeeded();
  }, [isOpen, mode, pickData, curatorPicks, breadcrumbCollection, collectionPicks]);

  // Internal navigation handlers - don't create browser history entries
  const handleNavigateToPick = (pickId: string) => {
    // If we're currently viewing a collection, save it for breadcrumb
    if (mode === 'collection' && collectionData) {
      setBreadcrumbCollection(collectionData);
    }
    
    // DON'T update browser URL - keep internal navigation within modal only
    // This prevents the close button from acting as a back button
    fetchPickData(pickId);
  };

  const handleNavigateToCollection = (collectionId: string) => {
    // Clear breadcrumb when navigating to a collection
    setBreadcrumbCollection(null);
    
    // DON'T update browser URL - keep internal navigation within modal only
    // This prevents the close button from acting as a back button
    fetchCollectionData(collectionId);
  };
  
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
    } else if (isLeftSwipe && !hasNext && !hasPrev) {
      // If no navigation, close modal on left swipe
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
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Handle body scroll and keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && hasPrev && onNavigatePrev) {
        onNavigatePrev();
      } else if (e.key === 'ArrowRight' && hasNext && onNavigateNext) {
        onNavigateNext();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
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
  }, [isOpen, onClose, hasNext, hasPrev, onNavigateNext, onNavigatePrev]);
  
  // Check if the pick is saved by the user (only for pick mode)
  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!user || mode !== 'pick' || !pickData) return;
      
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
  }, [user, pickData, isOpen, mode]);
  
  // Handle save/unsave (only for pick mode)
  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      openModal('signup');
      return;
    }

    if (!pickData) return;

    // Optimistic UI update - update state immediately
    const wasLiked = saved;
    setSaved(!saved);
    
    // Update favorites count optimistically
    if (pickData) {
      const currentCount = (pickData as any)?.favorites_count || 0;
      (pickData as any).favorites_count = wasLiked ? 
        Math.max(0, currentCount - 1) : 
        currentCount + 1;
    }

    setLoading(true);
    try {
      if (wasLiked) {
        await unsavePick(pickData.id);
        console.log('Successfully unliked pick');
      } else {
        await savePick(pickData.id);
        console.log('Successfully liked pick');
      }
    } catch (error) {
      console.error('Error toggling save status:', error);
      // Revert optimistic updates on error
      setSaved(wasLiked);
      if (pickData) {
        const currentCount = (pickData as any)?.favorites_count || 0;
        (pickData as any).favorites_count = wasLiked ? 
          currentCount + 1 : 
          Math.max(0, currentCount - 1);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle share with correct URL based on current content
  const handleShare = async () => {
    let shareUrl = '';
    let shareTitle = '';
    
    if (mode === 'pick' && pickData) {
      shareUrl = `${window.location.origin}/pick/${pickData.id}`;
      shareTitle = pickData.title;
    } else if (mode === 'collection' && collectionData) {
      shareUrl = `${window.location.origin}/collection/${collectionData.id}`;
      shareTitle = collectionData.title;
    }
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          url: shareUrl
        });
      } catch (error) {
        // User cancelled share or error occurred
        console.log('Share cancelled or failed:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        console.log('URL copied to clipboard:', shareUrl);
        // You could add a toast notification here
      } catch (error) {
        console.error('Failed to copy URL:', error);
      }
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
    if (loadingStates.mainContent) {
      return (
        <div className="px-4 pb-6 pt-4 space-y-6">
          {/* Skeleton for eyebrow */}
          <SkeletonLoader className="w-32" />
          
          {/* Skeleton for title and actions */}
          <div className="flex items-start justify-between">
            <div className="flex-1 mr-4 space-y-3">
              <SkeletonLoader className="w-3/4 h-12" />
              <SkeletonLoader className="w-1/2 h-6" />
            </div>
            <div className="flex space-x-3">
              <SkeletonLoader variant="button" className="w-12" />
              <SkeletonLoader variant="button" className="w-12" />
              <SkeletonLoader variant="button" className="w-12" />
            </div>
          </div>
          
          {/* Skeleton for image */}
          <SkeletonLoader variant="image" className="w-full h-80" />
          
          {/* Skeleton for story */}
          <div className="space-y-3">
            <SkeletonLoader className="w-16 h-3" />
            <SkeletonLoader className="w-full" />
            <SkeletonLoader className="w-4/5" />
            <SkeletonLoader className="w-3/4" />
          </div>
        </div>
      );
    }

    if (!pickData) return null;

    return (
      <div className={`px-4 pb-6 pt-4 transition-opacity duration-200 ${loadingStates.pickDetails ? 'opacity-60' : 'opacity-100'}`}>
        {/* Breadcrumb */}
        {breadcrumbCollection && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
            <button 
              onClick={() => handleNavigateToCollection(breadcrumbCollection.id)}
              className="hover:text-foreground transition-colors"
            >
              {breadcrumbCollection.title}
            </button>
            <span>&gt;</span>
            <span className="text-foreground">{pickData.title}</span>
          </div>
        )}

        {/* Reference Eyebrow */}
        {pickData.reference && (
          <div className="text-muted-foreground uppercase text-xs font-medium font-mono mb-2">
            {pickData.reference}
          </div>
        )}

        {/* Pick Title with Actions */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 mr-4">
              <h1 className="text-3xl md:text-4xl font-bold mb-3 text-foreground leading-tight">
                {pickData.title}
              </h1>
            </div>
            
            {/* Action buttons - icons only with actual data */}
            <div className="flex items-center space-x-3 pt-1">
              <button 
                className={`flex items-center space-x-1 transition-colors ${saved ? 'text-red-600' : 'text-foreground hover:text-red-600'}`}
                onClick={handleSave}
                disabled={loading}
              >
                <Heart className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
                <span className="text-sm">{(pickData as any)?.favorites_count || 0}</span>
              </button>
              <button className="flex items-center space-x-1 text-foreground hover:text-primary transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm">{(pickData as any)?.comments_count || 0}</span>
              </button>
              <button 
                className="flex items-center text-foreground hover:text-primary transition-colors"
                onClick={handleShare}
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Pick Image */}
        {pickData.image_url && (
          <div className="mb-6">
            <div className="relative w-full bg-secondary rounded-xl overflow-hidden">
              <PickImage 
                key={pickData.id}
                src={pickData.image_url} 
                alt={pickData.title}
                className="w-full h-auto"
                aspectRatio="auto"
              />
            </div>
          </div>
        )}

        {/* Pick Story */}
        {pickData.description && (
          <div className="mb-4">
            <h3 className="text-muted-foreground uppercase text-sm font-medium font-mono">STORY</h3>
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
      </div>
    );
  };

  // Render collection content
  const renderCollectionContent = () => {
    if (loadingStates.mainContent) {
      return (
        <div className="px-4 pb-6 pt-4 space-y-6">
          {/* Skeleton for issue eyebrow */}
          <SkeletonLoader className="w-40" />
          
          {/* Skeleton for title and actions */}
          <div className="flex items-start justify-between">
            <div className="flex-1 mr-4 space-y-3">
              <SkeletonLoader className="w-3/4 h-12" />
            </div>
            <div className="flex space-x-3">
              <SkeletonLoader variant="button" className="w-12" />
              <SkeletonLoader variant="button" className="w-12" />
              <SkeletonLoader variant="button" className="w-12" />
            </div>
          </div>
          
          {/* Skeleton for cover image */}
          <SkeletonLoader variant="image" className="w-full h-80" />
          
          {/* Skeleton for story */}
          <div className="space-y-3">
            <SkeletonLoader className="w-16 h-3" />
            <SkeletonLoader className="w-full" />
            <SkeletonLoader className="w-4/5" />
            <SkeletonLoader className="w-3/4" />
          </div>
        </div>
      );
    }

    if (!collectionData) return null;

    return (
      <div className="px-4 pb-6 pt-4">
        {/* Issue Number Eyebrow - Always show */}
        <div className="text-muted-foreground uppercase text-xs font-medium font-mono mb-2">
          {totalItems && totalItems > 0 
            ? `ISSUE #${(currentIndex || 0) + 1} OF ${totalItems}`
            : `ISSUE #${(currentIndex || 0) + 1}`
          }
        </div>
        
        {/* Collection Title with Actions */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-foreground leading-tight flex-1 mr-4">
              {collectionData.title}
            </h1>
            
            {/* Action buttons - icons only with actual data */}
            <div className="flex items-center space-x-3 pt-1">
              <button className="flex items-center space-x-1 text-foreground hover:text-red-600 transition-colors">
                <Heart className="w-5 h-5" />
                <span className="text-sm">{(collectionData as any)?.favorites_count || 0}</span>
              </button>
              <button className="flex items-center space-x-1 text-foreground hover:text-primary transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm">{(collectionData as any)?.comments_count || 0}</span>
              </button>
              <button 
                className="flex items-center text-foreground hover:text-primary transition-colors"
                onClick={handleShare}
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Collection Cover Image */}
        {collectionData.cover_image && (
          <div className="mb-6">
            <div className="relative w-full bg-secondary rounded-xl overflow-hidden">
              <img 
                src={collectionData.cover_image} 
                alt={collectionData.title}
                className="w-full h-auto"
              />
            </div>
          </div>
        )}

        {/* Collection Story/Description */}
        {collectionData.description && (
          <div className="mb-4">
            <h3 className="text-muted-foreground uppercase text-sm font-medium font-mono">STORY</h3>
            <div className="text-foreground text-base md:text-lg leading-relaxed mt-3">
              {collectionData.description}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[10000]" onClose={onClose}>
        {/* Black overlay */}
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
        
        {/* Navigation arrows */}
        {!isMobile && renderNavigationArrows()}
        
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
                  {/* Close button */}
                  <div className="absolute right-4 top-4 z-10">
                    <button
                      type="button"
                      className="w-10 h-10 min-w-[2.5rem] min-h-[2.5rem] aspect-square rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                      onClick={(e) => handleClose(e)}
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {/* Mobile content */}
                  {mode === 'pick' ? renderPickContent() : renderCollectionContent()}
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
                    height: 'calc(100vh - 80px)',
                    maxHeight: 'calc(100vh - 80px)'
                  }}
                >
                  {/* Close button */}
                  <div className="absolute right-5 top-5 z-10">
                    <button
                      type="button"
                      className="w-10 h-10 min-w-[2.5rem] min-h-[2.5rem] aspect-square rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                      onClick={(e) => handleClose(e)}
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {/* Desktop 2-Column Layout */}
                  <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Column: Main content with max-width for readability */}
                    <div className="lg:w-[70%]">
                      <div className="max-w-4xl">
                        {mode === 'pick' ? renderPickContent() : renderCollectionContent()}
                      </div>
                    </div>
                    
                    {/* Right Column: Sidebar info (30%) */}
                    <div className="lg:w-[30%]">
                      
                                              <div className="h-full flex flex-col space-y-6">
                        {mode === 'pick' && (
                          <>
                            {/* Pick Info Table */}
                            <div className="mt-8">
                              {loadingStates.sidebarInfo ? (
                                <div className="space-y-3">
                                  <div className="flex justify-between py-3 border-b border-border">
                                    <SkeletonLoader className="w-28" />
                                    <SkeletonLoader className="w-24" />
                                  </div>
                                  <div className="flex justify-between py-3 border-b border-border">
                                    <SkeletonLoader className="w-20" />
                                    <SkeletonLoader className="w-28" />
                                  </div>
                                  <div className="flex justify-between py-3 border-b border-border">
                                    <SkeletonLoader className="w-24" />
                                    <div className="flex gap-2">
                                      <SkeletonLoader className="w-16 h-6" />
                                      <SkeletonLoader className="w-20 h-6" />
                                    </div>
                                  </div>
                                </div>
                              ) : pickData && (
                                <div className="w-full font-mono text-sm">
                                  <div className="flex justify-between py-3 border-b border-border">
                                    <div className="text-muted-foreground">PICKED BY</div>
                                    <div className="text-foreground">{pickData.profile?.full_name || curatorData?.name || 'Anonymous'}</div>
                                  </div>
                                  <div className="flex justify-between py-3 border-b border-border">
                                    <div className="text-muted-foreground">PUBLISHED</div>
                                    <div className="text-foreground">{format(new Date(pickData.created_at), 'dd. MM. yyyy')}</div>
                                  </div>
                                  <div className="flex justify-between py-3 border-b border-border">
                                    <div className="text-muted-foreground">CATEGORY</div>
                                    <div className="text-foreground">
                                      <Tag className="font-mono">
                                        {pickData.category}
                                      </Tag>
                                    </div>
                                  </div>
                                  <div className="flex justify-between py-3 border-b border-border">
                                    <div className="text-muted-foreground">RANK</div>
                                    <div className="text-foreground">#{pickData.rank}</div>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Related Picks - Show collection picks if in collection context, otherwise curator picks */}
                            <div>
                              {/* Show collection picks if we're viewing a pick from a collection */}
                              {collectionPicks && collectionPicks.length > 0 ? (
                                <>
                                  <div className="text-muted-foreground uppercase text-sm font-medium font-mono mb-4">
                                    RELATED PICKS
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                    {collectionPicks.slice(0, 9).map((pick, index) => (
                                      <div 
                                        key={pick.id}
                                        className={`group cursor-pointer relative transition-all duration-200 ${pickData?.id === pick.id ? 'ring-2 ring-primary' : ''}`}
                                        onClick={() => handleNavigateToPick(pick.id)}
                                      >
                                        <div className="aspect-square bg-secondary overflow-hidden group-hover:ring-2 group-hover:ring-primary/20 transition-all">
                                          {pick.image_url ? (
                                            <img 
                                              key={pick.id}
                                              src={pick.image_url} 
                                              alt={pick.title}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                              <span className="text-xs">#{String(index + 1).padStart(2, '0')}</span>
                                            </div>
                                          )}
                                        </div>
                                        {loadingStates.pickDetails && pickData?.id === pick.id && (
                                          <div className="absolute inset-0 bg-background/40 flex items-center justify-center">
                                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </>
                              ) : (
                                /* Show curator picks for standalone pick view */
                                <>
                                  <div className="text-muted-foreground uppercase text-sm font-medium font-mono mb-4">
                                    Other picks by @{pickData?.profile?.full_name || curatorData?.name || 'curator'}
                                  </div>
                                  {loadingStates.relatedContent ? (
                                    <div className="grid grid-cols-3 gap-2">
                                      {Array.from({ length: 9 }, (_, i) => (
                                        <SkeletonLoader key={i} variant="image" />
                                      ))}
                                    </div>
                                  ) : curatorPicks.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-2">
                                      {curatorPicks.slice(0, 9).map((pick, index) => (
                                        <div 
                                          key={pick.id}
                                          className={`group cursor-pointer relative transition-all duration-200 ${pickData?.id === pick.id ? 'ring-2 ring-primary' : ''}`}
                                          onClick={() => handleNavigateToPick(pick.id)}
                                        >
                                          <div className="aspect-square bg-secondary overflow-hidden group-hover:ring-2 group-hover:ring-primary/20 transition-all">
                                            {pick.image_url ? (
                                              <img 
                                                key={pick.id}
                                                src={pick.image_url} 
                                                alt={pick.title}
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                <span className="text-xs">#{String(index + 1).padStart(2, '0')}</span>
                                              </div>
                                            )}
                                          </div>
                                          {loadingStates.pickDetails && pickData?.id === pick.id && (
                                            <div className="absolute inset-0 bg-background/40 flex items-center justify-center">
                                              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center text-muted-foreground py-8">
                                      No related picks available
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                            
                            {/* More Collections - Only show if we have curator collections */}
                            {curatorCollections.length > 0 && (
                              <div>
                                <div className="text-muted-foreground uppercase text-sm font-medium font-mono mb-4">MORE COLLECTIONS</div>
                                <div className="flex space-x-3 overflow-x-auto pb-2">
                                  {curatorCollections.slice(0, 5).map((collection, index) => (
                                    <div 
                                      key={collection.id}
                                      className="flex-shrink-0 w-32 cursor-pointer"
                                      onClick={() => handleNavigateToCollection(collection.id)}
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
                          </>
                        )}
                        
                        {mode === 'collection' && (
                          <>
                            {/* Collection Info Table - Add margin-top to align with left content */}
                            <div className="mt-8">
                              {loadingStates.sidebarInfo ? (
                                <div className="space-y-3">
                                  <div className="flex justify-between py-3 border-b border-border">
                                    <SkeletonLoader className="w-28" />
                                    <SkeletonLoader className="w-24" />
                                  </div>
                                  <div className="flex justify-between py-3 border-b border-border">
                                    <SkeletonLoader className="w-20" />
                                    <SkeletonLoader className="w-28" />
                                  </div>
                                  <div className="flex justify-between py-3 border-b border-border">
                                    <SkeletonLoader className="w-24" />
                                    <div className="flex gap-2">
                                      <SkeletonLoader className="w-16 h-6" />
                                      <SkeletonLoader className="w-20 h-6" />
                                    </div>
                                  </div>
                                </div>
                              ) : collectionData && (
                                <div className="w-full font-mono text-sm">
                                  <div className="flex justify-between py-3 border-b border-border">
                                    <div className="text-muted-foreground">COLLECTED BY</div>
                                    <div className="text-foreground">{curatorData?.name || 'Anonymous'}</div>
                                  </div>
                                  <div className="flex justify-between py-3 border-b border-border">
                                    <div className="text-muted-foreground">PUBLISHED</div>
                                    <div className="text-foreground">{format(new Date(collectionData.created_at), 'dd. MM. yyyy')}</div>
                                  </div>
                                  {collectionData.categories && collectionData.categories.length > 0 && (
                                    <div className="flex justify-between py-3 border-b border-border">
                                      <div className="text-muted-foreground">CATEGORIES</div>
                                      <div className="text-foreground text-right flex-1 ml-2">
                                        <div className="flex flex-wrap gap-2 justify-end">
                                          {collectionData.categories.map((category, index) => (
                                            <Tag key={index} className="font-mono">
                                              {category}
                                            </Tag>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* Related Picks - 3x3 Grid */}
                            {collectionPicks.length > 0 && (
                              <div>
                                <div className="text-muted-foreground uppercase text-sm font-medium font-mono mb-4">RELATED PICKS</div>
                                <div className="grid grid-cols-3 gap-2">
                                  {collectionPicks.slice(0, 9).map((pick, index) => (
                                    <div 
                                      key={pick.id}
                                      className={`group cursor-pointer relative transition-all duration-200 ${pickData?.id === pick.id ? 'ring-2 ring-primary' : ''}`}
                                      onClick={() => handleNavigateToPick(pick.id)}
                                    >
                                      <div className="aspect-square bg-secondary overflow-hidden group-hover:ring-2 group-hover:ring-primary/20 transition-all">
                                        {pick.image_url ? (
                                          <img 
                                            key={pick.id}
                                            src={pick.image_url} 
                                            alt={pick.title}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                            <span className="text-xs">#{String(index + 1).padStart(2, '0')}</span>
                                          </div>
                                        )}
                                      </div>
                                      {loadingStates.pickDetails && pickData?.id === pick.id && (
                                        <div className="absolute inset-0 bg-background/40 flex items-center justify-center">
                                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* More Collections - Using CollectionCard */}
                            {curatorCollections.length > 0 && (
                              <div>
                                <div className="text-muted-foreground uppercase text-sm font-medium font-mono mb-4">MORE COLLECTIONS</div>
                                <div className="flex space-x-3 overflow-x-auto pb-2">
                                  {curatorCollections
                                    .filter(c => c.id !== collectionData?.id)
                                    .slice(0, 5)
                                    .map((collection, index) => (
                                    <div 
                                      key={collection.id}
                                      className="flex-shrink-0 w-32 cursor-pointer"
                                      onClick={() => handleNavigateToCollection(collection.id)}
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
                          </>
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