import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { useAuth } from '../context/AuthContext';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const { fetchUserData } = useAppStore();
  
  // Initialize app data when user is available
  useEffect(() => {
    const initializeUserData = async () => {
      if (user) {
        try {
          console.log('AuthWrapper: Loading user data for', user.id);
          await fetchUserData(user.id);
          console.log('AuthWrapper: User data loaded successfully');
        } catch (error) {
          console.error('AuthWrapper: Failed to load user data', error);
        }
      }
      setIsInitialized(true);
    };
    
    initializeUserData();
  }, [user, fetchUserData]);
  
  // Show loading state while initializing
  if (!isInitialized && user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-24 mb-2.5"></div>
          <div className="h-2 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}
