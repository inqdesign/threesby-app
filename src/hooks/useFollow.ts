import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useFollow() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const followUser = useCallback(async (userId: string) => {
    if (!user) return false;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: userId
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error following user:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const unfollowUser = useCallback(async (userId: string) => {
    if (!user) return false;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .match({
          follower_id: user.id,
          following_id: userId
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getFollowCounts = useCallback(async (userId: string) => {
    try {
      const [{ data: followers }, { data: following }] = await Promise.all([
        supabase.rpc('get_follower_count', { profile_id: userId }),
        supabase.rpc('get_following_count', { profile_id: userId })
      ]);

      return {
        followers: followers || 0,
        following: following || 0
      };
    } catch (error) {
      console.error('Error getting follow counts:', error);
      return { followers: 0, following: 0 };
    }
  }, []);

  const isFollowing = useCallback(async (userId: string) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId);

      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  }, [user]);

  return {
    followUser,
    unfollowUser,
    getFollowCounts,
    isFollowing,
    loading
  };
}