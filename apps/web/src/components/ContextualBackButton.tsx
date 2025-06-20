import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

type ContextualBackButtonProps = {
  className?: string;
};

export function ContextualBackButton({ className = '' }: ContextualBackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { source?: string } | null;
  
  // Determine the back button text and destination based on the source
  const getBackDetails = () => {
    if (state?.source === 'curators') {
      return { text: 'Back to Curators', destination: '/curators' };
    }
    if (state?.source === 'discover') {
      return { text: 'Back to Discover', destination: '/discover' };
    }
    // Default case - just go back in history
    return { text: 'Back', destination: null };
  };
  
  const { text, destination } = getBackDetails();
  
  const handleClick = () => {
    if (destination) {
      navigate(destination);
    } else {
      navigate(-1); // Default to browser history
    }
  };
  
  return (
    <button 
      onClick={handleClick}
      className={`inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 text-sm ${className}`}
    >
      <ArrowLeft className="w-4 h-4 mr-1" />
      {text}
    </button>
  );
}
