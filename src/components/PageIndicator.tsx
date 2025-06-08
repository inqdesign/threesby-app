import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export function PageIndicator() {
  const location = useLocation();
  const state = location.state as { source?: string; profileName?: string } | null;
  const pathname = location.pathname;
  
  // Don't show anything on main pages
  if (pathname === '/discover' || pathname === '/curators') {
    return null;
  }
  
  // Handle profile pages
  if (pathname.startsWith('/profile/')) {
    if (state?.source === 'curators') {
      return (
        <div className="flex items-center text-sm text-gray-500 mb-4 mt-2">
          <Link to="/curators" className="text-gray-600 hover:text-gray-900">
            Curators
          </Link>
          <ChevronRight className="w-3 h-3 mx-1" />
          <span className="font-medium text-gray-800">
            {state.profileName || 'Profile'}
          </span>
        </div>
      );
    }
  }
  
  // Handle pick detail pages
  if (pathname.startsWith('/picks/')) {
    if (state?.source === 'curators') {
      return (
        <div className="flex items-center text-sm text-gray-500 mb-4 mt-2">
          <Link to="/curators" className="text-gray-600 hover:text-gray-900">
            Curators
          </Link>
          <ChevronRight className="w-3 h-3 mx-1" />
          <span className="font-medium text-gray-800">
            Pick Detail
          </span>
        </div>
      );
    }
  }
  
  return null;
}
