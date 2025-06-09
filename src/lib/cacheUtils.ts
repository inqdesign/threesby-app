/**
 * Utility functions for caching data in localStorage
 * This helps with preserving state across page refreshes
 */

// Cache keys
export const CACHE_KEYS = {
  USER_PROFILE: 'onshelf_user_profile',
  USER_PICKS: 'onshelf_user_picks',
  FEED_PICKS: 'onshelf_feed_picks',
  FEATURED_PICKS: 'onshelf_featured_picks',
  CURATORS: 'onshelf_curators',
  FEATURED_CURATORS: 'onshelf_featured_curators',
  CACHE_TIMESTAMP: 'onshelf_cache_timestamp'
};

// Cache expiration time (in milliseconds)
const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes (increased for better reliability)

/**
 * Save data to localStorage cache with timestamp
 */
export function saveToCache<T>(key: string, data: T): void {
  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
    console.log(`Cache saved for ${key} at ${new Date().toISOString()}`);
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
    const cachedItem = localStorage.getItem(key);
    if (!cachedItem) return null;
    
    const cacheData = JSON.parse(cachedItem);
    
    // Handle old cache format (without timestamp wrapper)
    if (!cacheData.timestamp) {
      console.log(`Removing old cache format for ${key}`);
      localStorage.removeItem(key);
      return null;
    }
    
    const now = Date.now();
    
    // Check if cache is expired
    if (now - cacheData.timestamp > CACHE_EXPIRATION) {
      console.log(`Cache expired for ${key}, removing`);
      localStorage.removeItem(key);
      return null;
    }
    
    console.log(`Cache hit for ${key}, age: ${Math.round((now - cacheData.timestamp) / 1000)}s`);
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
    const cachedItem = localStorage.getItem(key);
    if (!cachedItem) return true;
    
    const cacheData = JSON.parse(cachedItem);
    if (!cacheData.timestamp) return true;
    
    const now = Date.now();
    const isExpired = (now - cacheData.timestamp) > CACHE_EXPIRATION;
    console.log(`Cache check for ${key}: ${isExpired ? 'expired' : 'valid'}`);
    return isExpired;
  } catch (error) {
    console.error(`Error checking cache expiration for ${key}:`, error);
    return true;
  }
}

/**
 * Force refresh cache by clearing it
 */
export function forceCacheRefresh(key: string): void {
  try {
    localStorage.removeItem(key);
    console.log(`Forced cache refresh for ${key}`);
  } catch (error) {
    console.error(`Error forcing cache refresh for ${key}:`, error);
  }
}

/**
 * Clear all OnShelf cache data
 */
export function clearCache(): void {
  try {
    console.log('Clearing all cache data');
    Object.values(CACHE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Clear specific cache key
 */
export function clearCacheKey(key: string): void {
  try {
    localStorage.removeItem(key);
    console.log(`Cleared cache key: ${key}`);
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
    console.log('Curators cache cleared');
  } catch (error) {
    console.error('Error clearing curators cache:', error);
  }
}

/**
 * Get cache stats for debugging
 */
export function getCacheStats(): Record<string, any> {
  const stats: Record<string, any> = {};
  
  Object.entries(CACHE_KEYS).forEach(([name, key]) => {
    try {
      const cachedItem = localStorage.getItem(key);
      if (cachedItem) {
        const cacheData = JSON.parse(cachedItem);
        if (cacheData.timestamp) {
          const age = Date.now() - cacheData.timestamp;
          stats[name] = {
            exists: true,
            age: Math.round(age / 1000),
            expired: age > CACHE_EXPIRATION,
            size: cachedItem.length
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
