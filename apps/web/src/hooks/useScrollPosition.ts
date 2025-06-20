import { useCallback } from 'react';

/**
 * Storage key prefix for scroll positions
 */
export const SCROLL_POSITION_KEY = 'threesby_scroll_position';

/**
 * Simple hook for managing scroll positions across page navigation
 */
export function useScrollPosition() {
  /**
   * Save the current scroll position for a specific path
   */
  const saveScrollPosition = useCallback((path: string): void => {
    if (!path) return;
    
    // Get current scroll position
    const scrollY = window.scrollY;
    
    // Clean the path (remove query params and trailing slashes)
    const cleanPath = path.split('?')[0].replace(/\/$/, '');
    const key = `${SCROLL_POSITION_KEY}_${cleanPath}`;
    
    // Only save significant scroll positions (>10px)
    // This prevents saving tiny accidental scrolls
    if (scrollY > 10) {
      localStorage.setItem(key, scrollY.toString());
      console.log(`Saved scroll position for ${cleanPath}:`, scrollY);
    } else {
      // For minimal scrolling, explicitly save 0
      localStorage.setItem(key, '0');
      console.log(`Path ${cleanPath} has minimal scroll, saving as 0`);
    }
  }, []);

  /**
   * Get the saved scroll position for a specific path
   */
  const getScrollPosition = useCallback((path: string): number => {
    if (!path) return 0;
    
    // Clean the path
    const cleanPath = path.split('?')[0].replace(/\/$/, '');
    const key = `${SCROLL_POSITION_KEY}_${cleanPath}`;
    
    // Get saved position
    const savedPosition = localStorage.getItem(key);
    if (savedPosition) {
      const position = parseInt(savedPosition, 10);
      return isNaN(position) ? 0 : position;
    }
    
    return 0;
  }, []);

  /**
   * Restore the scroll position for a specific path
   */
  const restoreScrollPosition = useCallback((path: string): void => {
    const position = getScrollPosition(path);
    
    // Temporarily disable smooth scrolling for more reliable positioning
    const originalScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    
    // For minimal positions, always go to absolute top
    if (position <= 10) {
      window.scrollTo(0, 0);
      console.log(`Minimal scroll position for ${path}, scrolling to top`);
    } else {
      // For significant positions, restore exactly
      window.scrollTo(0, position);
      console.log(`Restored scroll position for ${path}:`, position);
    }
    
    // Make a second attempt after a short delay
    setTimeout(() => {
      if (position <= 10) {
        window.scrollTo(0, 0);
      } else {
        window.scrollTo(0, position);
      }
      
      // Restore original scroll behavior
      document.documentElement.style.scrollBehavior = originalScrollBehavior;
    }, 100);
  }, [getScrollPosition]);

  return {
    saveScrollPosition,
    getScrollPosition,
    restoreScrollPosition
  };
}
