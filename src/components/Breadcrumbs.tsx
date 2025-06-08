import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

type BreadcrumbProps = {
  items: {
    label: string;
    href: string;
  }[];
};

export function Breadcrumbs({ items }: BreadcrumbProps) {
  if (!items || items.length === 0) return null;
  
  return (
    <nav className="flex items-center text-sm text-gray-500 mb-4">
      {items.map((item, index) => (
        <React.Fragment key={item.href}>
          {index > 0 && (
            <ChevronRight className="w-3 h-3 mx-1 text-gray-400" />
          )}
          {index === items.length - 1 ? (
            <span className="font-medium text-gray-700">{item.label}</span>
          ) : (
            <Link to={item.href} className="hover:text-gray-700 hover:underline">
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export function useBreadcrumbs() {
  const location = useLocation();
  const state = location.state as { source?: string; profileName?: string } | null;
  
  // Default breadcrumbs for profile page
  if (location.pathname.startsWith('/profile/')) {
    // If we came from curators page, show breadcrumb
    if (state?.source === 'curators') {
      return [
        { label: 'Curators', href: '/curators' },
        { label: state.profileName || 'Profile', href: location.pathname }
      ];
    }
  }
  
  return null;
}
