import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store';
import { getSupabaseStorageKey } from '../lib/authUtils';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isCreator, setIsCreator] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fetchUserData = useAppStore(state => state.fetchUserData);
  const resetState = useAppStore(state => state.resetState);

  // Effect to handle auth state changes
  useEffect(() => {
    let mounted = true;
    console.log('useAuth: Initializing auth effect');

    // Get initial session
    const initializeAuth = async () => {
      setLoading(true);
      try {
        // Get the actual storage key that Supabase is using
        const storageKey = getSupabaseStorageKey();
        
        // Check localStorage directly first to validate token existence
        const storedSession = localStorage.getItem(storageKey);
        if (storedSession) {
          console.log('useAuth: Found token in localStorage with key:', storageKey);
        }
        
        // Get session from Supabase
        console.log('useAuth: Fetching session from Supabase');
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('useAuth: Session error:', sessionError);
          throw sessionError;
        }
        
        if (mounted) {
          if (data.session?.user) {
            const userId = data.session.user.id;
            console.log('useAuth: Valid session found:', data.session.user.email, 'expires:', new Date(data.session?.expires_at || 0).toLocaleString());
            
            // Set user in state
            setUser(data.session.user);
            await checkUserStatus(userId);
            
            // Force refresh token if it's getting close to expiry (within 10 minutes)
            const expiresAt = data.session.expires_at || 0;
            const nowInSeconds = Math.floor(Date.now() / 1000);
            const expiresInSeconds = expiresAt - nowInSeconds;
            
            if (expiresInSeconds < 600) {
              console.log('useAuth: Token expiring soon, refreshing');
              await supabase.auth.refreshSession();
            }
            
            // Load user data immediately when we have a session
            console.log('useAuth: Fetching user data');
            await fetchUserData(userId);
          } else {
            console.log('useAuth: No active session found');
            setUser(null);
            resetState();
          }
        }
      } catch (err) {
        console.error('useAuth: Error initializing auth:', err);
        setError('Failed to initialize authentication');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Initialize auth
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('useAuth: Auth state change event:', event);
      try {
        if (session?.user) {
          const userId = session.user.id;
          console.log('useAuth: User authenticated after state change:', session.user.email);
          setUser(session.user);
          await checkUserStatus(userId);
          
          // If user just signed in or token was refreshed, load their data
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
            console.log('useAuth: Loading user data after auth event:', event);
            await fetchUserData(userId);
          }
        } else {
          console.log('useAuth: User signed out or session expired');
          setUser(null);
          setIsAdmin(false);
          setIsCreator(false);
          
          // Clear app state on sign out
          if (event === 'SIGNED_OUT') {
            console.log('useAuth: Executing resetState after sign out');
            resetState();
            // Get the actual storage key that Supabase is using
            const storageKey = getSupabaseStorageKey();
            // Clear auth token from localStorage
            localStorage.removeItem(storageKey);
            console.log('useAuth: Removed auth token with key:', storageKey);
          }
        }
      } catch (err) {
        console.error('useAuth: Error in auth state change:', err);
        setError('Authentication state change failed');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    });

    // Setup periodic token refresh every 30 minutes
    const tokenRefreshInterval = setInterval(async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          console.log('useAuth: Refreshing auth token');
          await supabase.auth.refreshSession();
        }
      } catch (err) {
        console.error('useAuth: Error refreshing token:', err);
      }
    }, 30 * 60 * 1000);

    // Cleanup subscription and interval on unmount
    return () => {
      console.log('useAuth: Cleaning up auth effect');
      mounted = false;
      subscription.unsubscribe();
      clearInterval(tokenRefreshInterval);
    };
  }, [fetchUserData, resetState]);

  // Check if user is admin or creator
  const checkUserStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin, is_creator')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        setIsAdmin(data.is_admin || false);
        setIsCreator(data.is_creator || false);
      }
    } catch (err) {
      console.error('Error checking user status:', err);
      setIsAdmin(false);
      setIsCreator(false);
    }
  };

  // Helper function to sign out
  const signOut = async () => {
    try {
      // Clear app state first
      resetState();
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Update local state
      setUser(null);
      setIsAdmin(false);
      setIsCreator(false);
      
      return { success: true };
    } catch (err) {
      console.error('Error signing out:', err);
      setError('Failed to sign out');
      return { success: false, error: err };
    }
  };

  return { user, loading, isAdmin, isCreator, error, signOut };
}