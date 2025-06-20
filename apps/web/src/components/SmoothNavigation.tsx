import { useNavigate } from 'react-router-dom';

interface SmoothNavigationProps {
  to: string;
  state?: Record<string, any>;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * SmoothNavigation component for handling page transitions with proper scroll behavior
 * This component ensures that when navigating to a new page, the scroll position
 * is set to the top immediately before the navigation occurs
 */
export function SmoothNavigation({ 
  to, 
  state, 
  children, 
  className = '',
  onClick
}: SmoothNavigationProps) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // If there's a custom onClick handler, call it first
    if (onClick) {
      onClick(e);
    }
    
    // Set scroll position to top immediately
    window.scrollTo(0, 0);
    
    // Navigate to the target page
    // Use setTimeout with 0ms to ensure the scroll happens before navigation
    setTimeout(() => {
      navigate(to, { state });
    }, 0);
  };

  return (
    <a 
      href={to} 
      onClick={handleClick} 
      className={className}
    >
      {children}
    </a>
  );
}
