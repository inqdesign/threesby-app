import React from 'react';
import { CheckCircle2, Star } from 'lucide-react';

type UserBadgeProps = {
  isAdmin?: boolean;
  isCreator?: boolean;
  isBrand?: boolean;
  brandImageUrl?: string;
  className?: string;
};

export function UserBadge({ isAdmin, isCreator, isBrand, brandImageUrl, className = '' }: UserBadgeProps) {
  if (isAdmin) {
    return (
      <CheckCircle2 
        className={`w-4 h-4 text-green-500 ${className}`} 
        aria-label="Admin verified"
      />
    );
  }

  if (isBrand && brandImageUrl) {
    return (
      <img 
        src={brandImageUrl}
        alt="Brand"
        className={`w-4 h-4 rounded-full object-cover ${className}`}
        aria-label="Brand account"
      />
    );
  }

  if (isCreator) {
    return (
      <Star 
        className={`w-4 h-4 text-yellow-500 ${className}`} 
        aria-label="Curator"
      />
    );
  }

  return null;
}