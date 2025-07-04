import React, { useRef, useEffect } from "react";
import { useAppStore } from '../store/index';
import "./CuratorsPage.css";
import "./CuratorAnimation.css";
import { useAuth } from "../context/AuthContext";
import { ProfileSection } from "../components/ProfileSection";
import { Skeleton } from "../components/ui/skeleton";
import { PicksGrid } from "../components/PicksGrid";
import type { Pick, Profile } from "../types";

// Define a type for a curator with picks
type CuratorWithPicks = Profile & {
  picks: Pick[];
  filteredPicks?: {
    books: Pick[];
    products: Pick[];
    places: Pick[];
  };
};

// Custom hook to detect mobile screens
function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

export function CuratorsPage() {
  const { curators, curatorsLoading, fetchCurators } = useAppStore();
  const { user } = useAuth();
  const [selectedCurator, setSelectedCurator] = React.useState<CuratorWithPicks | null>(null);
  const scrollPositionRef = useRef<number>(0);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Handle scroll position tracking
  React.useEffect(() => {
    // Handle scroll events
    const handleScroll = () => {
      scrollPositionRef.current = window.scrollY;
      localStorage.setItem('curators_scroll_position', scrollPositionRef.current.toString());
    };

    window.addEventListener('scroll', handleScroll);
    
    // Try to restore scroll position when coming back to Curators page
    const checkForReturnNavigation = () => {
      // Check if we're returning from another page
      const isReturning = sessionStorage.getItem('returning_to_curators') === 'true';
      if (isReturning) {
        // Clear the flag
        sessionStorage.removeItem('returning_to_curators');
        
        // Get saved position
        const savedPosition = localStorage.getItem('curators_scroll_position');
        if (savedPosition) {
          const position = parseInt(savedPosition, 10);
          if (!isNaN(position) && position > 10) {
            console.log('Restoring Curators page scroll to:', position);
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
    
    // Check on mount
    checkForReturnNavigation();
    
    return () => {
      // Save final position when leaving the page
      localStorage.setItem('curators_scroll_position', scrollPositionRef.current.toString());
      // Set flag if navigating to Discover page
      if (window.location.pathname === '/curators') {
        sessionStorage.setItem('returning_to_curators', 'true');
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Fetch curators data when component mounts
  React.useEffect(() => {
    console.log('CuratorsPage: Checking if curators data needs to be fetched');
    
    // Force fetch curators data to ensure fresh data
    console.log('CuratorsPage: Force fetching curators data');
    fetchCurators(true); // Force fetch
  }, [fetchCurators]);
  
  // Process curators data
  const processedCurators = React.useMemo(() => {
    if (!curators || !Array.isArray(curators)) {
      console.log('CuratorsPage: No curators array available');
      return [];
    }
    
    console.log('CuratorsPage: Processing', curators.length, 'curators');
    
    return curators
      .filter(curator => {
        // Include curators that have at least one published pick (this is already filtered in the store)
        const hasPicks = Array.isArray(curator.picks) && curator.picks.length > 0;
        
        // Log why a curator might be filtered out
        if (!hasPicks) {
          console.log('Curator filtered out due to no picks:', curator.full_name || curator.id);
        }
        
        return hasPicks;
      })
      .map(curator => {
        // For active profiles, only show published picks to others
        // Admin/creator profiles can show all their picks
        const allPicks = Array.isArray(curator.picks) 
          ? curator.picks.filter((pick: Pick) => 
              curator.is_admin || curator.is_creator || pick.status === 'published'
            )
          : [];
          
        // Group picks by category and only keep top 3 for each category
        const bookPicks = allPicks.filter((pick: Pick) => pick.category === 'books')
          .sort((a: Pick, b: Pick) => {
            const rankA = a.rank !== undefined && a.rank !== null ? a.rank : 999;
            const rankB = b.rank !== undefined && b.rank !== null ? b.rank : 999;
            return rankA - rankB;
          })
          .slice(0, 3);
          
        const productPicks = allPicks.filter((pick: Pick) => pick.category === 'products')
          .sort((a: Pick, b: Pick) => {
            const rankA = a.rank !== undefined && a.rank !== null ? a.rank : 999;
            const rankB = b.rank !== undefined && b.rank !== null ? b.rank : 999;
            return rankA - rankB;
          })
          .slice(0, 3);
          
        const placePicks = allPicks.filter((pick: Pick) => pick.category === 'places')
          .sort((a: Pick, b: Pick) => {
            const rankA = a.rank !== undefined && a.rank !== null ? a.rank : 999;
            const rankB = b.rank !== undefined && b.rank !== null ? b.rank : 999;
            return rankA - rankB;
          })
          .slice(0, 3);
          
        console.log('Curator filtered picks:', {
          books: bookPicks,
          products: productPicks,
          places: placePicks
        });
          
        return {
          ...curator,
          picks: allPicks,
          filteredPicks: {
            books: bookPicks,
            products: productPicks,
            places: placePicks
          }
        } as CuratorWithPicks;
      })
      // Sort curators with most picks first
      .sort((a, b) => b.picks.length - a.picks.length);
  }, [curators]);
  
  // Set the first curator as selected if none is selected
  React.useEffect(() => {
    if (processedCurators.length > 0 && !selectedCurator) {
      setSelectedCurator(processedCurators[0]);
    }
  }, [processedCurators, selectedCurator]);

  // Use CSS-only approach for sticky behavior
  const profileSectionRef = useRef<HTMLDivElement>(null);
  const picksGridRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const loadingContainerRef = useRef<HTMLDivElement>(null);
  
  // Apply CSS custom properties for sticky positioning
  useEffect(() => {
    // Set CSS custom properties on mount
    if (mainContainerRef.current) {
      // Apply a CSS class to the container on mount
      mainContainerRef.current.classList.add('sticky-container');
    }
    
    // No need for scroll listeners - we'll use pure CSS for the sticky behavior
  }, [selectedCurator]);
  
  // Add CSS for sticky behavior
  useEffect(() => {
    // Create a style element
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      .sticky-container {
        position: relative;
      }
      
      .sticky-profile {
        position: sticky;
        top: 100px;
        align-self: flex-start;
        z-index: 10;
        padding: 1rem;
        border-radius: 0.5rem;
        /* Use hardware acceleration but avoid transitions that could cause flickering */
        transform: translate3d(0, 0, 0);
        -webkit-transform: translate3d(0, 0, 0);
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        /* Improve performance */
        will-change: transform;
      }
    `;
    
    // Add the style element to the document head
    document.head.appendChild(styleElement);
    
    // Clean up
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  // No curator selection needed since we removed the Other Curators section

  // No need for currentPicks as we're using filteredPicks directly

  if (curatorsLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="w-full mx-auto p-4 md:p-8">
          <div ref={loadingContainerRef} className="flex flex-col md:flex-row gap-[60px] sticky-container">
            {/* Profile Section Skeleton - Matching the actual ProfileSection structure */}
            <div className="w-full md:w-1/4">
              <div className="p-4 flex flex-col items-start w-full">
                {/* Header with avatar and name */}
                <div className="flex items-center gap-3 w-full">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div>
                    <Skeleton className="h-3 w-24 mb-1" /> {/* Title */}
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-32" /> {/* Name */}
                    </div>
                  </div>
                </div>
                
                {/* Follow stats and button */}
                <div className="w-full">
                  <div className="h-px w-full bg-border my-3"></div>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" /> {/* Follower count */}
                        <span className="text-gray-500">Followers</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" /> {/* Following count */}
                        <span className="text-gray-500">Following</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Bio section */}
                <div className="w-full">
                  <div className="h-px w-full bg-border my-3"></div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-4/5 mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                
                {/* Location section */}
                <div className="w-full">
                  <div className="h-px w-full bg-border my-3"></div>
                  <Skeleton className="h-4 w-28" />
                </div>
                
                {/* Interests section */}
                <div className="w-full">
                  <div className="h-px w-full bg-border my-3"></div>
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-14" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Main Content Area Skeleton */}
            <div className="flex-1">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="aspect-square bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (processedCurators.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto text-center py-12">
                          <h2 className="text-xl font-medium text-muted-foreground">No curators found</h2>
                <p className="text-muted-foreground mt-2">Check back later for featured curators</p>
        </div>
      </div>
    );
  }
  
  // No left side actions
  
  // No tabs header
  
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="w-full mx-auto p-4 md:p-8">
        {selectedCurator && (
          <div ref={mainContainerRef} className="flex flex-col md:flex-row gap-[60px] sticky-container">
            {/* Profile Section - Sticky while scrolling through PicksGrid */}
            <div 
              ref={profileSectionRef}
              className={`w-full md:w-1/4 ${isMobile ? '' : 'sticky-profile'}`}
              style={{}}>
              <div className="p-0">
                <ProfileSection 
                  profile={selectedCurator} 
                  isOwnProfile={user?.id === selectedCurator.id} 
                />
                {/* Other curators section removed */}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1">
              <div ref={picksGridRef} className="relative">
                {/* Add spacing at the bottom to ensure content below is visible */}
                <div className="pb-8">
                  <PicksGrid
                    picks={[
                      ...(selectedCurator.filteredPicks?.books || []),
                      ...(selectedCurator.filteredPicks?.products || []),
                      ...(selectedCurator.filteredPicks?.places || [])
                    ]}
                    gap="3rem"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}