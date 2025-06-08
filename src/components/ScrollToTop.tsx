import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useScrollPosition } from '../hooks/useScrollPosition';

/**
 * List of pages that should remember scroll position
 */
const REMEMBER_SCROLL_PAGES = [
  '/discover',
  '/curators',
  '/my-threes'
];

/**
 * Component that handles scroll restoration when navigating between pages
 */
export function ScrollToTop() {
  const location = useLocation();
  const { pathname } = location;
  const { saveScrollPosition, restoreScrollPosition } = useScrollPosition();
  const isFirstMount = useRef(true);

  // Save scroll position when navigating away from a page
  useEffect(() => {
    // Log navigation for debugging
    console.log('Navigation detected:', pathname);
    
    // Return cleanup function that runs when component unmounts or before re-render
    return () => {
      // Only save scroll for pages that should remember position
      const cleanPath = pathname.split('?')[0].replace(/\/$/, '');
      const shouldSaveScroll = REMEMBER_SCROLL_PAGES.some(page => 
        cleanPath === page || cleanPath.startsWith(page + '/')
      );
      
      if (shouldSaveScroll) {
        saveScrollPosition(pathname);
        console.log('Saved scroll position for:', pathname);
      }
    };
  }, [pathname, saveScrollPosition]);
  
  // Handle scroll restoration when navigating to a page
  useEffect(() => {
    // Always scroll to top for detail pages
    if (pathname.startsWith('/picks/')) {
      window.scrollTo(0, 0);
      return;
    }
    
    // Handle special case: returning from pick detail page
    const fromPickDetail = sessionStorage.getItem('fromPickDetail');
    
    if (fromPickDetail === 'true') {
      // Clear the session storage
      sessionStorage.removeItem('fromPickDetail');
      
      // Get the saved scroll position from localStorage
      const savedPosition = localStorage.getItem('scrollPosition');
      const timestamp = localStorage.getItem('scrollTimestamp');
      
      if (savedPosition && timestamp) {
        // Only restore if timestamp is recent (within last 5 minutes)
        const now = Date.now();
        const then = parseInt(timestamp);
        if (now - then < 5 * 60 * 1000) {
          console.log('Restoring scroll position from pick detail:', savedPosition);
          setTimeout(() => {
            window.scrollTo(0, parseInt(savedPosition));
          }, 100);
          return;
        }
      }
    }
    
    // Check if this is a page that should restore scroll
    const cleanPath = pathname.split('?')[0].replace(/\/$/, '');
    const shouldRestoreScroll = REMEMBER_SCROLL_PAGES.some(page => 
      cleanPath === page || cleanPath.startsWith(page + '/')
    );
    
    // For first render or non-scroll pages, go to top
    if (isFirstMount.current || !shouldRestoreScroll) {
      window.scrollTo(0, 0);
    } else if (shouldRestoreScroll) {
      // Restore scroll position for pages that should remember
      restoreScrollPosition(pathname);
    }
    
    // No longer first mount after initial run
    isFirstMount.current = false;
  }, [pathname, location.state, restoreScrollPosition]);

  return null;
}