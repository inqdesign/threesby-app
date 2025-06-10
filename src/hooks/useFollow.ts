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
      
      // Trigger a custom event to notify other components about the follow change
      window.dispatchEvent(new CustomEvent('followChanged', { 
        detail: { userId, action: 'follow' } 
      }));
      
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
      
      // Trigger a custom event to notify other components about the follow change
      window.dispatchEvent(new CustomEvent('followChanged', { 
        detail: { userId, action: 'unfollow' } 
      }));
      
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
      // Use direct table queries instead of RPC functions for better reliability
      const [followersResponse, followingResponse] = await Promise.all([
        supabase
          .from('follows')
          .select('follower_id', { count: 'exact' })
          .eq('following_id', userId),
        supabase
          .from('follows')
          .select('following_id', { count: 'exact' })
          .eq('follower_id', userId)
      ]);

      const { count: followersCount, error: followersError } = followersResponse;
      const { count: followingCount, error: followingError } = followingResponse;

      if (followersError) {
        console.error('Error getting followers count:', followersError);
      }
      if (followingError) {
        console.error('Error getting following count:', followingError);
      }

      const result = {
        followers: followersCount || 0,
        following: followingCount || 0
      };
      
      return result;
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