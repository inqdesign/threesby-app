import { memo, useMemo, useState, useEffect } from 'react';
import { useImageCache, imageCache } from '../hooks/useImageCache';
import './LazyImage.css';

interface ProfileAvatarProps {
  url: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Optimized profile avatar component with skeleton loading
 * Prevents reloading when scrolling through feed items
 */
export const ProfileAvatar = memo(({ url, name, size = 'md' }: ProfileAvatarProps) => {
  // Track loading state for skeleton animation
  const [isLoaded, setIsLoaded] = useState(imageCache.has(url));
  const [hasError, setHasError] = useState(false);
  
  // Use image caching hook to prevent unnecessary reloads
  const cachedUrl = useImageCache(url);
  
  // Use memoized values to prevent unnecessary re-renders
  const sizeClasses = useMemo(() => ({
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12'
  }), []);
  
  const minWidth = useMemo(() => {
    return size === 'sm' ? '28px' : size === 'md' ? '36px' : '48px';
  }, [size]);
  
  // Generate initials for fallback
  const initials = useMemo(() => {
    if (!name) return '?';
    const nameParts = name.split(' ');
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  }, [name]);
  
  // Load and cache the image
  useEffect(() => {
    if (!url || isLoaded) return;
    
    const img = new Image();
    img.src = url;
    
    img.onload = () => {
      imageCache.set(url, url);
      setIsLoaded(true);
    };
    
    img.onerror = () => {
      setHasError(true);
      setIsLoaded(true);
    };
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [url, isLoaded]);
  
  // Render skeleton during loading
  if (!isLoaded) {
    return (
      <div className="relative" style={{ minWidth }}>
        <div className={`${sizeClasses[size]} rounded-full bg-gray-200 animate-pulse`}></div>
      </div>
    );
  }
  
  // Render fallback for error
  if (hasError) {
    return (
      <div className="relative" style={{ minWidth }}>
        <div className={`${sizeClasses[size]} rounded-full bg-gray-200 flex items-center justify-center text-gray-500`}>
          <span style={{ fontSize: size === 'sm' ? '10px' : size === 'md' ? '12px' : '16px' }}>
            {initials}
          </span>
        </div>
      </div>
    );
  }
  
  // Render the loaded image
  return (
    <div className="relative" style={{ minWidth }}>
      <img
        src={cachedUrl || url}
        alt={name}
        className={`rounded-full profile-avatar ${sizeClasses[size]}`}
        loading="eager"
        decoding="async"
        onError={() => setHasError(true)}
      />
    </div>
  );
});

ProfileAvatar.displayName = 'ProfileAvatar';
