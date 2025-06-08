import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (mounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            await checkUserStatus(session.user.id);
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      try {
        setUser(session?.user ?? null);
        if (session?.user) {
          await checkUserStatus(session.user.id);
        } else {
          setIsAdmin(false);
          setIsCreator(false);
        }
      } catch (err) {
        console.error('Error in auth state change:', err);
        setError('Authentication state change failed');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const checkUserStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin, is_creator')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setIsAdmin(data.is_admin || false);
        setIsCreator(data.is_creator || false);
      } else {
        setIsAdmin(false);
        setIsCreator(false);
      }
      
      setError(null);
    } catch (error) {
      console.error('Error checking user status:', error);
      setIsAdmin(false);
      setIsCreator(false);
      setError('Failed to fetch user status');
    }
  };

  return { user, loading, isAdmin, isCreator, error };
}