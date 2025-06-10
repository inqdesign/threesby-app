import { useState, useEffect, useCallback } from 'react';
import { supabase } from "../lib/supabase";
import type { Profile, Pick } from '../types';

// Profile cache for performance
const profileCache: Record<string, Profile> = {};

export function useProfileData(profileIdentifier: string | undefined, userId: string | undefined, userRole?: string, isUsernameRoute: boolean = false) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (identifier = profileIdentifier) => {
    if (!identifier) {
      setLoading(false);
      return;
    }

    // Use identifier for cache key
    const cacheKey = isUsernameRoute ? `username:${identifier}` : identifier;

    // Clear cache when explicitly refreshing
    if (identifier === profileIdentifier && profileCache[cacheKey]) {
      delete profileCache[cacheKey];
    }

    if (profileCache[cacheKey]) {
      setProfile(profileCache[cacheKey]);
      setPicks(profileCache[cacheKey].picks || []);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Build query based on whether we're looking up by username or ID
      const profileQuery = supabase
        .from('profiles')
        .select('*, picks(*)');
      
      if (isUsernameRoute) {
        profileQuery.eq('username', identifier);
      } else {
        profileQuery.eq('id', identifier);
      }
      
      // Fetch profile and follows data in parallel for better performance
      const profileResponse = await profileQuery.maybeSingle();
      
      if (profileResponse.error) {
        throw profileResponse.error;
      }
      
      if (!profileResponse.data) {
        setError(isUsernameRoute ? 'Username not found' : 'Profile not found');
        setLoading(false);
        return;
      }

      const profileData = profileResponse.data;
      const profileId = profileData.id;

      // Use the same approach as useFollow hook for consistency
      const [followersResponse, followingResponse] = await Promise.all([
        supabase
          .from('follows')
          .select('follower_id', { count: 'exact' })
          .eq('following_id', profileId),
        supabase
          .from('follows')
          .select('following_id', { count: 'exact' })
          .eq('follower_id', profileId)
      ]);

      const { count: followersCount, error: followersError } = followersResponse;
      const { count: followingCount, error: followingError } = followingResponse;

      if (followersError) {
        console.error('Error getting followers count for profile:', followersError);
      }
      if (followingError) {
        console.error('Error getting following count for profile:', followingError);
      }

      // Apply visibility rules based on profile status and pick status
      const isOwnProfile = userId === profileId;
      const isAdmin = userRole === 'admin';
      const profilePicks = profileData.picks || [];
      
      // Filter picks based on visibility rules
      const visiblePicks = isOwnProfile || isAdmin
        ? profilePicks // Show all picks to owner or admin
        : profileData.status === 'approved'
          ? profilePicks // Show all picks for approved profiles to public visitors
          : []; // Don't show any picks for non-approved profiles

      const finalProfileData = {
        ...profileData,
        followers_count: followersCount || 0,
        following_count: followingCount || 0,
        picks: visiblePicks
      };

      profileCache[cacheKey] = finalProfileData;
      setProfile(finalProfileData);
      setPicks(visiblePicks);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [profileIdentifier, userId, userRole, isUsernameRoute]);

  useEffect(() => {
    if (profileIdentifier) {
      fetchProfile();
    }
  }, [profileIdentifier, fetchProfile]);

  // Listen for follow changes to refresh profile data
  useEffect(() => {
    const handleFollowChange = (event: CustomEvent) => {
      const { userId } = event.detail;
      // If this profile was affected by the follow change, refresh it
      if (profile && (userId === profile.id || userId === profileIdentifier)) {
        console.log('Follow change detected, invalidating cache and refreshing profile data...');
        
        // Clear the profile from cache to force fresh data
        const cacheKey = isUsernameRoute ? `username:${profileIdentifier}` : profileIdentifier;
        if (cacheKey && profileCache[cacheKey]) {
          delete profileCache[cacheKey];
        }
        
        fetchProfile();
      }
    };

    window.addEventListener('followChanged', handleFollowChange as EventListener);
    
    return () => {
      window.removeEventListener('followChanged', handleFollowChange as EventListener);
    };
  }, [profile, profileIdentifier, fetchProfile, isUsernameRoute]);

  return { profile, picks, loading, error, fetchProfile };
}
