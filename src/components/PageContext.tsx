import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Define the context structure
type PageContextType = {
  currentSection: string;
  isSubPage: boolean;
  parentSection?: string;
};

// Create the context with default values
const PageContext = createContext<PageContextType>({
  currentSection: '',
  isSubPage: false,
  parentSection: undefined
});

// Hook to use the context
export const usePageContext = () => useContext(PageContext);

// Provider component
export function PageContextProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [contextValue, setContextValue] = useState<PageContextType>({
    currentSection: '',
    isSubPage: false,
    parentSection: undefined
  });

  useEffect(() => {
    // Determine the current section based on the URL path
    const path = location.pathname;
    const state = location.state as { source?: string } | null;
    
    // Default context
    let newContext: PageContextType = {
      currentSection: '',
      isSubPage: false,
      parentSection: undefined
    };
    
    // Set the current section based on the first part of the path
    if (path.startsWith('/discover')) {
      newContext.currentSection = 'discover';
    } else if (path.startsWith('/curators')) {
      newContext.currentSection = 'curators';
    } else if (path.startsWith('/profile/')) {
      newContext.currentSection = 'profile';
      
      // If we came from curators, mark this as a subpage
      if (state?.source === 'curators') {
        newContext.isSubPage = true;
        newContext.parentSection = 'curators';
      } else if (state?.source === 'discover') {
        newContext.isSubPage = true;
        newContext.parentSection = 'discover';
      }
    } else if (path.startsWith('/picks/')) {
      newContext.currentSection = 'picks';
      
      // Set parent section based on where we came from
      if (state?.source === 'curators') {
        newContext.isSubPage = true;
        newContext.parentSection = 'curators';
      } else if (state?.source === 'discover') {
        newContext.isSubPage = true;
        newContext.parentSection = 'discover';
      } else if (state?.source === 'profile') {
        newContext.isSubPage = true;
        newContext.parentSection = 'profile';
      }
    }
    
    setContextValue(newContext);
  }, [location]);

  return (
    <PageContext.Provider value={contextValue}>
      {children}
    </PageContext.Provider>
  );
}
