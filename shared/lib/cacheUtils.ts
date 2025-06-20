/**
 * Utility functions for caching data in localStorage
 * This helps with preserving state across page refreshes
 */

// Cache keys
export const CACHE_KEYS = {
  USER_PROFILE: 'onshelf_user_profile',
  USER_PICKS: 'onshelf_user_picks',
  FEED_PICKS: 'onshelf_feed_picks',
  FEED_CONTENT: 'onshelf_feed_content',
  FEATURED_PICKS: 'onshelf_featured_picks',
  CURATORS: 'onshelf_curators',
  FEATURED_CURATORS: 'onshelf_featured_curators',
  CACHE_TIMESTAMP: 'onshelf_cache_timestamp'
};

// Cache expiration time (in milliseconds)
const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes

// Detect if we're in Chrome for special handling
const isChrome = typeof navigator !== 'undefined' && 
  /Chrome/.test(navigator.userAgent) && 
  /Google Inc/.test(navigator.vendor);

/**
 * Chrome-specific localStorage wrapper with error handling
 */
function chromeLocalStorageSetItem(key: string, value: string): boolean {
  try {
    if (isChrome) {
      // Force localStorage to sync in Chrome
      localStorage.removeItem(key);
      localStorage.setItem(key, value);
      // Verify it was actually set
      const retrieved = localStorage.getItem(key);
      if (retrieved !== value) {
        console.warn(`Chrome localStorage verification failed for ${key}`);
        return false;
      }
    } else {
      localStorage.setItem(key, value);
    }
    return true;
  } catch (error) {
    console.error(`Error setting localStorage (${key}):`, error);
    return false;
  }
}

/**
 * Chrome-specific localStorage getter with fallback
 */
function chromeLocalStorageGetItem(key: string): string | null {
  try {
    const value = localStorage.getItem(key);
    // Remove the double-check that causes inconsistency warnings
    // The warnings were harmless but confusing for debugging
    return value;
  } catch (error) {
    console.error(`Error getting localStorage (${key}):`, error);
    return null;
  }
}

/**
 * Save data to localStorage cache with timestamp
 */
export function saveToCache<T>(key: string, data: T): void {
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
      browser: isChrome ? 'chrome' : 'other'
    };
    
    const success = chromeLocalStorageSetItem(key, JSON.stringify(cacheData));
    if (!success) {
      console.error(`Failed to save cache for ${key}`);
    }
  } catch (error) {
    console.error(`Error saving to cache (${key}):`, error);
  }
}

/**
 * Get data from localStorage cache if it exists and is not expired
 * Returns null if cache is expired or doesn't exist
 */
export function getFromCache<T>(key: string): T | null {
  try {
    const cachedItem = chromeLocalStorageGetItem(key);
    if (!cachedItem) return null;
    
    const cacheData = JSON.parse(cachedItem);
    
    // Handle old cache format (without timestamp wrapper)
    if (!cacheData.timestamp) {
      localStorage.removeItem(key);
      return null;
    }
    
    const now = Date.now();
    
    // Check if cache is expired
    if (now - cacheData.timestamp > CACHE_EXPIRATION) {
      localStorage.removeItem(key);
      return null;
    }
    
    return cacheData.data as T;
  } catch (error) {
    console.error(`Error retrieving from cache (${key}):`, error);
    // Clear corrupted cache entry
    localStorage.removeItem(key);
    return null;
  }
}

/**
 * Check if cache is expired for a specific key
 */
export function isCacheExpired(key: string): boolean {
  try {
    const cachedItem = chromeLocalStorageGetItem(key);
    if (!cachedItem) return true;
    
    const cacheData = JSON.parse(cachedItem);
    if (!cacheData.timestamp) return true;
    
    const now = Date.now();
    const isExpired = (now - cacheData.timestamp) > CACHE_EXPIRATION;
    return isExpired;
  } catch (error) {
    console.error(`Error checking cache expiration for ${key}:`, error);
    return true;
  }
}

/**
 * Force refresh cache by clearing it - Chrome-optimized
 */
export function forceCacheRefresh(key: string): void {
  try {
    if (isChrome) {
      // Multiple attempts to clear in Chrome
      localStorage.removeItem(key);
      setTimeout(() => localStorage.removeItem(key), 0);
      setTimeout(() => localStorage.removeItem(key), 10);
    } else {
      localStorage.removeItem(key);
    }

  } catch (error) {
    console.error(`Error forcing cache refresh for ${key}:`, error);
  }
}

/**
 * Clear all OnShelf cache data - Chrome-optimized
 */
export function clearCache(): void {
  try {
    if (isChrome) {
      // Multiple clearing attempts for Chrome
      Object.values(CACHE_KEYS).forEach(key => {
        localStorage.removeItem(key);
        setTimeout(() => localStorage.removeItem(key), 0);
        setTimeout(() => localStorage.removeItem(key), 10);
      });
    } else {
      Object.values(CACHE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Clear specific cache key
 */
export function clearCacheKey(key: string): void {
  try {
    if (isChrome) {
      localStorage.removeItem(key);
      setTimeout(() => localStorage.removeItem(key), 0);
    } else {
      localStorage.removeItem(key);
    }

  } catch (error) {
    console.error(`Error clearing cache key (${key}):`, error);
  }
}

/**
 * Clear curators cache specifically
 */
export function clearCuratorsCache(): void {
  try {
    clearCacheKey(CACHE_KEYS.CURATORS);
    clearCacheKey(CACHE_KEYS.FEATURED_CURATORS);
  } catch (error) {
    console.error('Error clearing curators cache:', error);
  }
}

/**
 * Get cache stats for debugging
 */
export function getCacheStats(): Record<string, any> {
  const stats: Record<string, any> = {
    browser: isChrome ? 'Chrome' : 'Other',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
  };
  
  Object.entries(CACHE_KEYS).forEach(([name, key]) => {
    try {
      const cachedItem = chromeLocalStorageGetItem(key);
      if (cachedItem) {
        const cacheData = JSON.parse(cachedItem);
        if (cacheData.timestamp) {
          const age = Date.now() - cacheData.timestamp;
          stats[name] = {
            exists: true,
            age: Math.round(age / 1000),
            expired: age > CACHE_EXPIRATION,
            size: cachedItem.length,
            browser: cacheData.browser || 'unknown'
          };
        } else {
          stats[name] = { exists: true, format: 'old', size: cachedItem.length };
        }
      } else {
        stats[name] = { exists: false };
      }
    } catch (error) {
      stats[name] = { error: error instanceof Error ? error.message : String(error) };
    }
  });
  
  return stats;
}

/**
 * Chrome-specific cache flush
 */
export function flushChromeCache(): void {
  if (!isChrome) return;
  
  // Clear all our cache keys
  clearCache();
  
  // Force garbage collection if available
  if ('gc' in window && typeof (window as any).gc === 'function') {
    try {
      (window as any).gc();
    } catch (e) {
      // Ignore errors
    }
  }
}
