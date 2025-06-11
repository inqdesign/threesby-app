import React, { memo, useMemo, useState, useEffect } from 'react';
import { useImageCache, imageCache } from '../hooks/useImageCache';
import './LazyImage.css';

interface PickImageProps {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  onClick?: (e: React.MouseEvent) => void;
  aspectRatio?: 'square' | 'auto' | '3:4';
  variant?: 'feed' | 'detail' | 'thumbnail';
  /**
   * Optional custom styles for the container
   */
  containerStyle?: React.CSSProperties;
  /**
   * Optional priority prop for compatibility with Next.js Image API.
   * This prop is ignored in this implementation but accepted to avoid TS errors.
   */
  priority?: boolean;
}

/**
 * Optimized pick image component with skeleton loading
 * Prevents reloading when scrolling through feed items
 */
export const PickImage = memo(({ 
  src, 
  alt, 
  className = '', 
  wrapperClassName = '',
  onClick,
  aspectRatio = '3:4',
  variant = 'feed',
  containerStyle
}: PickImageProps) => {
  // Track loading state for skeleton animation
  const [isLoaded, setIsLoaded] = useState(imageCache.has(src));
  const [hasError, setHasError] = useState(false);
  
  // Use image caching hook to prevent unnecessary reloads
  const cachedSrc = useImageCache(src);
  
  // Generate optimized image URLs for different sizes - memoized to prevent recalculation
  const optimizedImageUrl = useMemo(() => cachedSrc || src, [cachedSrc, src]);
  
  // Generate srcSet for responsive images - memoized to prevent recalculation
  const srcSet = useMemo(() => {
    if (!optimizedImageUrl) return '';
    return variant === 'feed' 
      ? `${optimizedImageUrl} 400w, ${optimizedImageUrl} 800w` 
      : variant === 'detail'
      ? `${optimizedImageUrl} 800w, ${optimizedImageUrl} 1200w`
      : `${optimizedImageUrl} 200w, ${optimizedImageUrl} 400w`;
  }, [optimizedImageUrl, variant]);
  
  // Generate sizes attribute for responsive images - memoized to prevent recalculation
  const sizes = useMemo(() => {
    return variant === 'feed'
      ? '(max-width: 768px) 100vw, 400px'
      : variant === 'detail'
      ? '(max-width: 768px) 100vw, 800px'
      : '(max-width: 768px) 100px, 200px';
  }, [variant]);
  
  // No need for error image fallback as we're handling errors with a custom UI
  
  // Memoize the container class to prevent unnecessary re-renders
  const containerClass = useMemo(() => {
    // Use aspectRatio to determine the appropriate class
    const baseClass = aspectRatio === 'auto' ? 'pick-image-container-no-ratio' : 'pick-image-container';
    return `relative overflow-hidden ${wrapperClassName} ${baseClass}`;
  }, [wrapperClassName, aspectRatio]);
  
  // Load and cache the image
  useEffect(() => {
    if (!src || isLoaded) return;
    
    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      imageCache.set(src, src);
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
  }, [src, isLoaded]);
  
  // Handle click events
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.stopPropagation(); // Prevent event bubbling to parent
      onClick(e);
    }
  };
  
  // Render skeleton during loading
  if (!isLoaded) {
    return (
      <div className={containerClass} style={containerStyle}>
        <div className={`w-full h-full bg-muted animate-pulse ${className}`}></div>
      </div>
    );
  }
  
  // Render fallback for error
  if (hasError) {
    return (
      <div className={containerClass} style={containerStyle}>
        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
          <span>Image not available</span>
        </div>
      </div>
    );
  }
  
  // Render the loaded image
  return (
    <div className={containerClass} style={containerStyle} onClick={handleClick}>
      <img
        src={optimizedImageUrl}
        alt={alt}
        className={`pick-image ${className}`}
        loading="eager"
        decoding="async"
        srcSet={srcSet}
        sizes={sizes}
        onError={() => setHasError(true)}
      />
    </div>
  );
});

PickImage.displayName = 'PickImage';
