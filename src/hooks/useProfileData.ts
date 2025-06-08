import { useState, useEffect, useCallback } from 'react';
import { supabase } from "../lib/supabase";
import type { Profile, Pick } from '../types';

// Profile cache for performance
const profileCache: Record<string, Profile> = {};

export function useProfileData(profileId: string | undefined, userId: string | undefined, userRole?: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (id = profileId) => {
    if (!id) {
      setLoading(false);
      return;
    }

    // Clear cache when explicitly refreshing
    if (id === profileId && profileCache[id]) {
      delete profileCache[id];
    }

    if (profileCache[id]) {
      setProfile(profileCache[id]);
      setPicks(profileCache[id].picks || []);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch profile and follows data in parallel for better performance
      const [profileResponse, followersResponse, followingResponse] = await Promise.all([
        supabase
          .from('profiles')
          .select('*, picks(*)')
          .eq('id', id)
          .maybeSingle(),
          
        supabase
          .from('follows')
          .select('follower_id')
          .eq('following_id', id),
          
        supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', id)
      ]);
      
      const { data, error } = profileResponse;
      
      if (error) {
        throw error;
      }
      
      if (data === null) {
        setError('Profile not found');
        setLoading(false);
        return;
      }

      const { data: followersData, error: followersError } = followersResponse;
      if (followersError) throw followersError;

      const { data: followingData, error: followingError } = followingResponse;
      if (followingError) throw followingError;

      const followersCount = followersData?.length || 0;
      const followingCount = followingData?.length || 0;

      // Apply visibility rules based on profile status and pick status
      const isOwnProfile = userId === id;
      const isAdmin = userRole === 'admin';
      const profilePicks = data.picks || [];
      
      // Filter picks based on visibility rules
      const visiblePicks = isOwnProfile || isAdmin
        ? profilePicks // Show all picks to owner or admin
        : data.status === 'approved'
          ? profilePicks // Show all picks for approved profiles to public visitors
          : []; // Don't show any picks for non-approved profiles

      const profileData = {
        ...data,
        followers_count: followersCount,
        following_count: followingCount,
        picks: visiblePicks
      };

      profileCache[id] = profileData;
      setProfile(profileData);
      setPicks(visiblePicks);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [profileId, userId, userRole]);

  useEffect(() => {
    if (profileId) {
      fetchProfile();
    }
  }, [profileId, fetchProfile]);

  return { profile, picks, loading, error, fetchProfile };
}
