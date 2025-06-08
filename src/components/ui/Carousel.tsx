import React, { useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type CarouselProps = {
  slides: React.ReactNode[];
  interval?: number;
  showControls?: boolean;
  showIndicators?: boolean;
  autoPlay?: boolean;
  className?: string;
  onSlideChange?: (index: number) => void;
};

export const Carousel = forwardRef<{ setCurrentIndex: (index: number) => void }, CarouselProps>((
  {
    slides,
    interval = 8000, // Increased from 5000 to 8000ms (8 seconds)
    showControls = true,
    showIndicators = true,
    autoPlay = true,
    className = '',
    onSlideChange
  }, ref
) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  const slideVariants = {
    enter: () => ({
      opacity: 0,
      zIndex: 0
    }),
    center: {
      opacity: 1,
      zIndex: 1
    },
    exit: () => ({
      opacity: 0,
      zIndex: 0
    })
  };

  // Expose the setCurrentIndex method via ref using a stable reference
  const setIndexSafely = useCallback((index: number) => {
    // Use requestAnimationFrame to ensure this happens outside of render cycle
    requestAnimationFrame(() => {
      setCurrentIndex(index);
      if (onSlideChange) onSlideChange(index);
    });
  }, [onSlideChange]);
  
  // Create a stable reference that won't change on re-renders
  useImperativeHandle(ref, () => ({
    setCurrentIndex: setIndexSafely
  }), [setIndexSafely]);

  const navigate = useCallback((newDirection: number, isUserAction = false) => {
    if (isUserAction) {
      setUserInteracted(true);
    }
    
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => {
      let nextIndex = prevIndex + newDirection;
      if (nextIndex >= slides.length) nextIndex = 0;
      if (nextIndex < 0) nextIndex = slides.length - 1;
      console.log('Slide changed to:', nextIndex, isUserAction ? '(user action)' : '');
      if (onSlideChange) onSlideChange(nextIndex);
      return nextIndex;
    });
  }, [slides.length, onSlideChange]);

  useEffect(() => {
    if (autoPlay && !isPaused && !userInteracted && slides.length > 1) {
      const timer = setInterval(() => navigate(1), interval);
      return () => clearInterval(timer);
    }
  }, [autoPlay, isPaused, userInteracted, interval, navigate, slides.length]);

  if (!slides.length) return null;

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            duration: 0.7,
            ease: "easeInOut"
          }}
          className="w-full"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(_, { offset, velocity }) => {
            const swipe = Math.abs(offset.x) * velocity.x;
            if (swipe < -10000) {
              navigate(1, true);
            } else if (swipe > 10000) {
              navigate(-1, true);
            }
          }}
        >
          {slides[currentIndex]}
        </motion.div>
      </AnimatePresence>

      {showControls && slides.length > 1 && (
        <>
          <button
            onClick={() => navigate(-1, true)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 shadow-lg flex items-center justify-center z-10 hover:bg-white transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => navigate(1, true)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 shadow-lg flex items-center justify-center z-10 hover:bg-white transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {showIndicators && slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setUserInteracted(true);
                setDirection(index > currentIndex ? 1 : -1);
                setCurrentIndex(index);
                if (onSlideChange) onSlideChange(index);
              }}
              className={`carousel-indicator ${
                index === currentIndex 
                  ? 'active'
                  : 'inactive'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});