import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { SmoothPickCard } from '../components/SmoothPickCard';
import { CollectionCard } from '../components/CollectionCard';
import { Search } from 'lucide-react';
// import { useScrollDirection } from '../hooks/useScrollDirection'; // Commented out as it's not currently used
import { useMediaQuery } from '../hooks/useMediaQuery';
import './DiscoverPage.css';
import type { Profile } from '../types';
import { FeaturedContent } from '../components/FeaturedContent';
import { Footer } from '../components/Footer';
import { useAppStore } from '../store/index';
import { CategoryFilter, FilterCategory } from '../components/CategoryFilter';
import { supabase } from '../lib/supabase';

type Category = 'places' | 'products' | 'books';

// Local Collection type definition
type Collection = {
  id: string;
  profile_id: string;
  title: string;
  description: string;
  categories: string[];
  picks: string[];
  cover_image?: string;
  font_color?: 'dark' | 'light';
  issue_number?: number; // Issue number for the collection
  created_at: string;
  updated_at: string;
  profiles?: Profile;
};

// Mixed content type for the feed
type FeedItem = {
  type: 'pick' | 'collection';
  data: any;
  updated_at: string;
};

type DiscoverPageProps = {};

export function DiscoverPage({}: DiscoverPageProps) {
  const location = useLocation();
  const { feedPicks, loading: feedLoading, fetchFeedPicks } = useAppStore();
  const [, setError] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [showAll, setShowAll] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchInput] = useState(false);
  
  // New state for collections and mixed content
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [mixedContent, setMixedContent] = useState<FeedItem[]>([]);
  
  // const isScrollingUp = useScrollDirection(); // Commented out as it's not currently used
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const scrollPositionRef = useRef<number>(0);
  const feedContainerRef = useRef<HTMLDivElement>(null);
  const featuredSectionRef = useRef<HTMLDivElement>(null);
  const hasRestoredScrollRef = useRef<boolean>(false);
  const [isSticky, setIsSticky] = useState(false);
  const [featuredSectionHeight, setFeaturedSectionHeight] = useState(0);

  // Measure the height of the featured section on mobile
  useEffect(() => {
    if (!isDesktop && featuredSectionRef.current) {
      const measureFeaturedHeight = () => {
        const height = featuredSectionRef.current?.offsetHeight || 0;
        setFeaturedSectionHeight(height);
      };
      
      // Measure initially and on resize
      measureFeaturedHeight();
      window.addEventListener('resize', measureFeaturedHeight);
      
      // Also measure after content loads (images might change height)
      const observer = new ResizeObserver(measureFeaturedHeight);
      observer.observe(featuredSectionRef.current);
      
      return () => {
        window.removeEventListener('resize', measureFeaturedHeight);
        if (featuredSectionRef.current) {
          observer.disconnect();
        }
      };
    }
  }, [isDesktop]);
  
  // Handle scroll position saving and sticky header behavior
  useEffect(() => {
    // Track last scroll position for smoother transitions
    let lastScrollY = window.scrollY;
    let ticking = false;
    
    // Handle scroll events with debouncing to prevent flickering
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Store current scroll position
          const currentScrollY = window.scrollY;
          scrollPositionRef.current = currentScrollY;
          localStorage.setItem('discover_scroll_position', currentScrollY.toString());
          
          // Update last scroll position
          lastScrollY = currentScrollY;
          
          // Calculate threshold based on featured section height on mobile
          const stickyThreshold = isDesktop ? 50 : featuredSectionHeight;
          
          // Only update sticky state if we've scrolled significantly
          if (Math.abs(currentScrollY - lastScrollY) > 5) {
            // Always make it sticky after scrolling past the featured section
            setIsSticky(currentScrollY > stickyThreshold);
          }
          
          ticking = false;
        });
        
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // Try to restore scroll position when coming back to Discover page
    const checkForReturnNavigation = () => {
      // Check if we're returning from another page
      const isReturning = sessionStorage.getItem('returning_to_discover') === 'true';
      if (isReturning) {
        // Clear the flag
        sessionStorage.removeItem('returning_to_discover');
        
        // Get saved position
        const savedPosition = localStorage.getItem('discover_scroll_position');
        if (savedPosition) {
          const position = parseInt(savedPosition, 10);
          if (!isNaN(position) && position > 10) {
            console.log('Restoring Discover page scroll to:', position);
            // Disable smooth scrolling temporarily
            document.documentElement.style.scrollBehavior = 'auto';
            
            // For desktop browsers, we need a more aggressive approach
            const restoreScroll = () => {
              window.scrollTo(0, position);
              console.log('Scroll restoration attempt');
            };
            
            // Multiple attempts with increasing delays for reliability
            restoreScroll(); // Immediate
            setTimeout(restoreScroll, 10); // Quick follow-up
            setTimeout(restoreScroll, 50); // Short delay
            setTimeout(restoreScroll, 100); // Medium delay
            setTimeout(restoreScroll, 300); // Longer delay for content loading
            setTimeout(() => {
              restoreScroll();
              // Reset scroll behavior
              document.documentElement.style.scrollBehavior = '';
            }, 500); // Final attempt
          }
        }
      }
    };
    
    // Check on mount and when visibility changes
    checkForReturnNavigation();
    
    return () => {
      // Save final position when leaving the page
      localStorage.setItem('discover_scroll_position', scrollPositionRef.current.toString());
      // Set flag if navigating to Curators page
      if (window.location.pathname === '/discover') {
        sessionStorage.setItem('returning_to_discover', 'true');
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Handle scroll position restoration with improved reliability
  useEffect(() => {
    if (location.state?.source === 'back_from_pick_detail' && !hasRestoredScrollRef.current) {
      const savedPosition = location.state.scrollPosition || 0;
      
      // Temporarily disable smooth scrolling for instant jump
      document.documentElement.style.scrollBehavior = 'auto';
      
      // Try to restore position immediately
      window.scrollTo(0, savedPosition);
      
      // Also try after a short delay (for more reliability)
      setTimeout(() => {
        window.scrollTo(0, savedPosition);
        
        // Try one more time after content has likely loaded
        setTimeout(() => {
          window.scrollTo(0, savedPosition);
          
          // Restore original scroll behavior
          document.documentElement.style.scrollBehavior = '';
          
          hasRestoredScrollRef.current = true;
        }, 100);
      }, 50);
    }
  }, [location.state]);

  useEffect(() => {
    // Reset the scroll restoration flag when navigating away
    return () => {
      hasRestoredScrollRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Fetch feed picks when the component mounts
    const fetchWithRetry = async () => {
      try {
        // Force fetch if we have no data or if explicitly refreshing
        const shouldForce = feedPicks.length === 0 || location.state?.refresh;
        await fetchFeedPicks(shouldForce);
        setError(null);
      } catch (err) {
        console.error('Error fetching feed picks:', err);
        setError('Failed to load feed picks. Please try again later.');
      }
    };

    fetchWithRetry();
  }, [location.state, fetchFeedPicks]);

  useEffect(() => {
    console.log('DiscoverPage: Fetching feed picks');
    fetchFeedPicks();
  }, [fetchFeedPicks]);

  // Function to fetch collections
  const fetchCollections = async () => {
    try {
      setCollectionsLoading(true);
      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          profiles (
            id,
            full_name,
            email,
            avatar_url,
            title,
            is_admin,
            is_creator
          )
        `)
        .order('updated_at', { ascending: false })
        .limit(25);

      if (error) throw error;
      setCollections(data || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
      setCollections([]);
    } finally {
      setCollectionsLoading(false);
    }
  };

  // Function to create mixed content from picks and collections
  const createMixedContent = () => {
    const mixedItems: FeedItem[] = [];
    
    // Add picks
    feedPicks.forEach(pick => {
      mixedItems.push({
        type: 'pick',
        data: pick,
        updated_at: pick.updated_at || pick.created_at
      });
    });
    
    // Add collections
    collections.forEach(collection => {
      mixedItems.push({
        type: 'collection',
        data: collection,
        updated_at: collection.updated_at || collection.created_at
      });
    });
    
    // Sort by latest update time
    mixedItems.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    
    setMixedContent(mixedItems);
  };

  // Refresh mixed content when picks or collections change
  useEffect(() => {
    createMixedContent();
  }, [feedPicks, collections]);

  // Fetch collections when component mounts
  useEffect(() => {
    fetchCollections();
  }, []);

  // Filter and sort the mixed content by the most recent update date
  const filteredContent = Array.isArray(mixedContent) ? mixedContent
    .filter((item) => {
      if (item.type === 'pick') {
        const pick = item.data;
        // Get the profile from the pick object
        const profile = (pick as any).profile as Profile;
        
        const matchesSearch =
          profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          profile?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pick.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pick.description.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = showAll || selectedCategories.includes(pick.category as Category);
        
        // Exclude picks with rank=0
        const isValidRank = pick.rank !== 0;

        return matchesSearch && matchesCategory && isValidRank;
      } else if (item.type === 'collection') {
        const collection = item.data;
        const profile = collection.profiles as Profile;
        
        const matchesSearch =
          profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          profile?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          collection.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          collection.description.toLowerCase().includes(searchTerm.toLowerCase());

        // For collections, check if any of their categories match the selected categories
        const matchesCategory = showAll || 
          (collection.categories && collection.categories.some((cat: string) => 
            selectedCategories.includes(cat as Category)
          ));

        return matchesSearch && matchesCategory;
      }
      return false;
    }) : [];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Filter component outside main content with proper background color, padding, and sticky position */}
      <div className="sticky top-0 z-30 bg-background pl-4 md:pl-8 pr-0 pt-4 md:pt-8 pb-0">
        {/* Mobile Search Input - Expandable */}
        {showSearchInput && (
          <div className="relative mb-4 md:hidden pr-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search picks..."
              className="w-full pl-10 pr-4 py-2.5 bg-input text-foreground rounded-full text-xs md:text-sm outline-none border-0"
              autoFocus
              style={{ fontSize: '16px' }} /* Prevents zoom on iOS */
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
        )}
        <CategoryFilter
          categories={['books', 'places', 'products'] as FilterCategory[]}
          activeCategories={selectedCategories as FilterCategory[]}
          onCategoryChange={(categories) => {
            setSelectedCategories(categories as Category[]);
            setShowAll(categories.length === 0);
          }}
          showSearch={true}
          headerText="Selected With Care"
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          pageType="discover"
        />
      </div>
      
      {/* Main content with mobile padding removed */}
      <div className="container mx-auto px-4 md:px-8 pt-4 md:pt-8 pb-8 md:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Featured content is now integrated directly into the feed */}
          
          {/* Feed Section (Full Width) */}
          <div className="lg:col-span-12">

            {/* Feed Content */}
            <div className="discover-page-content" style={{ marginTop: '0' }}>
              {feedLoading ? (
                  <div className="feed-items grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-6 gap-y-6 sm:gap-y-10 md:gap-y-12">
                    {/* Featured Picks Skeleton */}
                    <div className="space-y-4 pick-card-container overflow-hidden">
                      <div className="w-full aspect-square bg-muted animate-pulse" />
                      <div className="py-4 px-3 space-y-2">
                        <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                        <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                    
                    {/* Featured Curators Skeleton */}
                    <div className="space-y-4 pick-card-container overflow-hidden">
                      <div className="w-full aspect-square bg-muted animate-pulse" />
                      <div className="py-4 px-3 space-y-2">
                        <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                        <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                    
                    {/* Regular feed picks skeletons */}
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="space-y-4 pick-card-container overflow-hidden">
                        <div className="w-full aspect-square bg-muted animate-pulse" />
                        <div className="py-4 px-3 space-y-2">
                          <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                          <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                  {/* Featured content row for mobile - 2 columns */}
                  <div className="w-full grid grid-cols-2 gap-2 mb-6 sm:hidden">
                    {/* Featured Picks */}
                    <div className="relative">
                      <div className="absolute z-10 flex items-center gap-2.5" style={{ top: '0.5rem', left: '0.5rem' }}>
                        <span className="bg-[#ADFF8B] text-[#262626] text-xs font-mono px-2 py-1" style={{ fontFamily: 'Geist Mono, monospace', fontSize: '10px', padding: '4px 8px' }}>OUR THREES</span>
                      </div>
                      <FeaturedContent 
                        type="threes" 
                        title="OUR THREES" 
                        key="featured-picks-mobile"
                        className="featured-mobile"
                      />
                    </div>
                    
                    {/* Featured Curators */}
                    <div className="relative">
                      <div className="absolute z-10 flex items-center gap-2.5" style={{ top: '0.5rem', left: '0.5rem' }}>
                        <span className="bg-[#ADFF8B] text-[#262626] text-xs font-mono px-2 py-1" style={{ fontFamily: 'Geist Mono, monospace', fontSize: '10px', padding: '4px 8px' }}>CURATORS</span>
                      </div>
                      <FeaturedContent 
                        type="curators" 
                        title="THREE CURATORS" 
                        key="featured-curators-mobile"
                        className="featured-mobile"
                      />
                    </div>
                  </div>
                  
                  {/* Main feed grid - 2 columns on mobile */}
                  <div className="feed-items grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-6 gap-y-6 sm:gap-y-10 md:gap-y-12" ref={feedContainerRef}>
                    {/* Featured Picks - Only visible on tablet and above */}
                    <div className="relative hidden sm:block">
                      <div className="absolute z-10 flex items-center gap-2.5" style={{ top: '0.5rem', left: '0.5rem' }}>
                        <span className="bg-[#ADFF8B] text-[#262626] text-xs font-mono px-2 py-1" style={{ fontFamily: 'Geist Mono, monospace', fontSize: '12px', padding: '5px 10px' }}>OUR THREES</span>
                        <div id="threes-pagination" className="flex space-x-1"></div>
                      </div>
                      <FeaturedContent 
                        type="threes" 
                        title="OUR THREES" 
                        key="featured-picks-integrated"
                        className="featured-integrated"
                      />
                    </div>
                    
                    {/* Featured Curators - Only visible on tablet and above */}
                    <div className="relative hidden sm:block">
                      <div className="absolute z-10 flex items-center gap-2.5" style={{ top: '0.5rem', left: '0.5rem' }}>
                        <span className="bg-[#ADFF8B] text-[#262626] text-xs font-mono px-2 py-1" style={{ fontFamily: 'Geist Mono, monospace', fontSize: '12px', padding: '5px 10px' }}>CURATORS</span>
                        <div id="curators-pagination" className="flex space-x-1"></div>
                      </div>
                      <FeaturedContent 
                        type="curators" 
                        title="THREE CURATORS" 
                        key="featured-curators-integrated"
                        className="featured-integrated"
                      />
                    </div>
                    
                    {/* Regular feed content - mixed picks and collections */}
                    {filteredContent.map((item) => (
                      item.type === 'pick' ? (
                        <SmoothPickCard
                          key={`pick-${item.data.id}`}
                          pick={item.data}
                          variant="feed"
                          display="desktop"
                        />
                      ) : (
                        <div key={`collection-${item.data.id}`} className="collection-card-no-radius">
                          <CollectionCard
                            collection={item.data}
                            linkWrapper={true}
                          />
                        </div>
                      )
                    ))}
                  </div>
                  </>
                )
              }
            </div>
          </div>

          {/* Footer (Desktop Only) */}
          <div className="lg:col-span-12 hidden lg:block">
            <div className="space-y-6">
                {/* Footer */}
                <div className="footer-container">
                  <Footer />
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
