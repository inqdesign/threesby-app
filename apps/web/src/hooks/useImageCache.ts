import { useEffect, useState, useRef, useCallback } from 'react';

// Global in-memory cache for images that persists between renders
const imageCache = new Map<string, string>();

// Track when the cache was last cleared to prevent stale data
let lastCacheCleared = Date.now();

// Pre-cache specific images that we know will be used frequently
// This helps prevent reloading of common profile images
const PRECACHED_IMAGES = [
  'https://ncjwuguemdbreswyglbs.supabase.co/storage/v1/object/public/profiles/avatars/6646c74d-5f68-43e7-86e5-fefd1b502beb/1744115781762.png'
];

// Function to clear the image cache when user logs in/out
export function clearImageCache() {
  console.log('Clearing image cache to prevent stale profile images');
  imageCache.clear();
  lastCacheCleared = Date.now();
}

// Initialize pre-caching of important images
function initializeImagePreCache() {
  PRECACHED_IMAGES.forEach(url => {
    if (!imageCache.has(url)) {
      const img = new Image();
      img.onload = () => {
        imageCache.set(url, url);
        console.log(`Pre-cached image: ${url}`);
      };
      img.src = url;
    }
  });
}

// Run pre-caching on module load
initializeImagePreCache();

/**
 * Enhanced image caching hook that prevents reloading when scrolling
 * Uses a combination of in-memory cache and browser cache
 */
export function useImageCache(src: string | undefined, fallback?: string): string | undefined {
  // Use a ref to track if this component is mounted
  const isMounted = useRef(true);
  
  // Store the source in a ref to avoid unnecessary re-renders
  const srcRef = useRef(src);
  
  // Initialize state with cached value if available
  const [cachedSrc, setCachedSrc] = useState<string | undefined>(() => {
    if (!src) return undefined;
    return imageCache.has(src) ? imageCache.get(src) : src;
  });

  // Cache the image and update state
  const cacheImage = useCallback((imageUrl: string) => {
    if (!imageUrl) return;
    
    // If already in cache, use it immediately
    if (imageCache.has(imageUrl)) {
      if (isMounted.current) {
        setCachedSrc(imageCache.get(imageUrl));
      }
      return;
    }
    
    // Otherwise, load and cache the image
    const img = new Image();
    
    // Use crossOrigin to avoid CORS issues with certain image sources
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Cache the image URL
      imageCache.set(imageUrl, imageUrl);
      
      // Only update state if component is still mounted
      if (isMounted.current) {
        setCachedSrc(imageUrl);
      }
    };
    
    img.onerror = () => {
      console.error(`Failed to load image: ${imageUrl}`);
      if (fallback && isMounted.current) {
        imageCache.set(imageUrl, fallback);
        setCachedSrc(fallback);
      }
    };
    
    // Set image source to trigger loading
    img.src = imageUrl;
  }, [fallback]);

  // Effect to handle image caching
  useEffect(() => {
    // Update the source ref
    srcRef.current = src;
    
    // Cache the image if it's not already cached
    if (src) {
      cacheImage(src);
    }
    
    // Cleanup function to prevent memory leaks
    return () => {
      isMounted.current = false;
    };
  }, [src, cacheImage]);

  // Reset the mounted flag when the component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Return the cached source or the original source as fallback
  return cachedSrc || src;
}

// Export the cache for direct access if needed
export { imageCache };

