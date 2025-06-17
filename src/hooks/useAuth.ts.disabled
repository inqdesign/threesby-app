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
      try {
        console.log('useAuth: Fetching session from Supabase');
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('useAuth: Session error:', sessionError);
          throw sessionError;
        }
        
        console.log('useAuth: Session data received:', data.session ? 'Session exists' : 'No session');
        
        if (mounted) {
          if (data.session?.user) {
            console.log('useAuth: Valid session found:', data.session.user.email);
            setUser(data.session.user);
            await checkUserStatus(data.session.user.id);
          } else {
            console.log('useAuth: No valid session found');
            setUser(null);
            setIsAdmin(false);
            setIsCreator(false);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('useAuth: Error initializing auth:', err);
        setError('Failed to initialize authentication');
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
      setError(null);
      
      try {
        if (session?.user) {
          console.log('useAuth: User authenticated:', session.user.email);
          setUser(session.user);
          await checkUserStatus(session.user.id);
          
          // Load user data after successful authentication
          if (event === 'SIGNED_IN') {
            console.log('useAuth: Loading user data after sign in');
            try {
              await fetchUserData(session.user.id);
            } catch (error) {
              console.error('useAuth: Error loading user data:', error);
            }
          }
        } else {
          console.log('useAuth: User signed out or session expired, event:', event);
          setUser(null);
          setIsAdmin(false);
          setIsCreator(false);
          
          // Clear app state on sign out
          if (event === 'SIGNED_OUT') {
            console.log('useAuth: Executing resetState after sign out');
            resetState();
            
            // Clear all auth-related localStorage items
            const storageKey = getSupabaseStorageKey();
            const keysToRemove = [
              storageKey,
              'sb-auth-token', // fallback key
              'supabase.auth.token'
            ];
            
            keysToRemove.forEach(key => {
              if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                console.log('useAuth: Removed storage key:', key);
              }
            });
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

    // Cleanup subscription on unmount
    return () => {
      console.log('useAuth: Cleaning up auth effect');
      mounted = false;
      subscription.unsubscribe();
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

      if (error) {
        console.error('Error checking user status:', error);
        setIsAdmin(false);
        setIsCreator(false);
        return;
      }

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
      setLoading(true);
      
      // Clear app state first
      resetState();
      
      // Clear localStorage before signing out
      const storageKey = getSupabaseStorageKey();
      const keysToRemove = [
        storageKey,
        'sb-auth-token',
        'supabase.auth.token'
      ];
      
      keysToRemove.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          console.log('signOut: Removed storage key:', key);
        }
      });
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
      
      console.log('Successfully signed out');
      
      // Force reload to ensure clean state
      window.location.href = '/discover';
      
    } catch (err) {
      console.error('Error in signOut:', err);
      setError('Failed to sign out');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    isAdmin,
    isCreator,
    error,
    signOut
  };
}