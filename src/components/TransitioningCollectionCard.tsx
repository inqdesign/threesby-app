import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTransitionStore } from '../store/transitionStore';

export function TransitioningCollectionCard() {
  const { selectedCollection, endTransition } = useTransitionStore();
  const [targetRect, setTargetRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  // Calculate the target position for the detail page
  useEffect(() => {
    if (selectedCollection) {
      // Get the target position (where the card should animate to)
      // This would typically be the position in the detail page
      const targetPosition = {
        x: window.innerWidth * 0.16, // Position for the second column in detail page
        y: window.innerHeight * 0.24 + 48, // Account for navbar height
        width: 240, // Target width in the detail page
        height: 160 // Target height in the detail page
      };
      
      setTargetRect(targetPosition);
    }
  }, [selectedCollection]);
  
  if (!selectedCollection || !selectedCollection.rect) return null;
  
  const { rect, coverImage, title } = selectedCollection;
  
  return (
    <motion.div
      className="fixed top-0 left-0 z-50 pointer-events-none"
      initial={{
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        opacity: 1
      }}
      animate={{
        x: targetRect.x,
        y: targetRect.y,
        width: targetRect.width,
        height: targetRect.height,
        opacity: 1
      }}
      transition={{
        duration: 0.5,
        ease: "easeInOut"
      }}
      onAnimationComplete={endTransition}
    >
      <div 
        className="w-full h-full rounded-lg overflow-hidden shadow-lg"
        style={{
          backgroundImage: coverImage ? `url(${coverImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: coverImage ? 'transparent' : '#f0f0f0'
        }}
      >
        {!coverImage && (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
            {title?.substring(0, 2) || ''}
          </div>
        )}
      </div>
    </motion.div>
  );
}
