import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAppStore } from '../store/index';
import { Loader2 } from 'lucide-react';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { userProfile, fetchUserData } = useAppStore();
  const [checking, setChecking] = React.useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('AuthCallback: Handling OAuth callback');
      
      // Wait for auth to be ready
      if (authLoading) {
        console.log('AuthCallback: Auth still loading, waiting...');
        return;
      }

      if (!user) {
        console.log('AuthCallback: No user found, redirecting to home');
        navigate('/');
        return;
      }

      console.log('AuthCallback: User authenticated:', user.email);
      
      try {
        // Fetch user profile to check onboarding status
        await fetchUserData(user.id);
        
        // Small delay to ensure state is updated
        setTimeout(() => {
          setChecking(false);
        }, 500);
      } catch (error) {
        console.error('AuthCallback: Error fetching user data:', error);
        setChecking(false);
      }
    };

    handleAuthCallback();
  }, [user, authLoading, fetchUserData, navigate]);

  useEffect(() => {
    if (!checking && user) {
      // Determine where to redirect based on onboarding status
      if (!userProfile || !userProfile.onboarding_completed) {
        console.log('AuthCallback: User needs onboarding, redirecting to /onboarding');
        navigate('/onboarding', { replace: true });
      } else {
        console.log('AuthCallback: User onboarding complete, redirecting to /discover');
        navigate('/discover', { replace: true });
      }
    }
  }, [checking, user, userProfile, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Setting up your account...</h2>
        <p className="text-gray-600">Please wait while we complete your sign-in.</p>
      </div>
    </div>
  );
} 