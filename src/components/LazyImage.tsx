import React, { useState, useEffect, useRef } from 'react';
import './LazyImage.css';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string; // e.g., '3/4', '1/1'
  placeholderColor?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  aspectRatio = '3/4',
  placeholderColor = '#f3f2ed',
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // Set up intersection observer to load image when it enters viewport
  useEffect(() => {
    if (!imgRef.current) return;

    // Set image src immediately if it's a small string (likely a placeholder)
    if (src && src.length < 100) {
      setImageSrc(src);
      return;
    }

    observerRef.current = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        setImageSrc(src);
        observerRef.current?.disconnect();
      }
    }, {
      rootMargin: '200px 0px', // Start loading when image is 200px from viewport
      threshold: 0.01
    });

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [src]);

  // Handle image load and error events
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setError(true);
    onError?.();
  };

  // Calculate aspect ratio style
  const aspectRatioStyle = aspectRatio 
    ? { aspectRatio } 
    : {};

  return (
    <div 
      className={`relative overflow-hidden ${className}`} 
      style={aspectRatioStyle}
    >
      {/* Skeleton loading state */}
      {!isLoaded && !error && (
        <div 
          className="skeleton absolute inset-0" 
          style={{ 
            backgroundSize: '400% 100%',
            animation: 'shimmer 1.5s infinite linear'
          }}
        />
      )}
      
      {/* Image */}
      <img
        ref={imgRef}
        src={imageSrc || ''}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
      
      {/* Error state */}
      {error && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-gray-100"
          style={{ backgroundColor: placeholderColor }}
        >
          <span className="text-gray-400 text-sm">Image not available</span>
        </div>
      )}
    </div>
  );
};

export default LazyImage;
