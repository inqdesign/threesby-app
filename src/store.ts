import { create } from 'zustand';
import { supabase } from './lib/supabase';
import type { Profile, Pick } from './types';
import { saveToCache, getFromCache, CACHE_KEYS, clearCache, isCacheExpired } from './lib/cacheUtils';

interface AppState {
  userProfile: Profile | null;
  userPicks: Pick[];
  feedPicks: Pick[];
  featuredPicks: Pick[];
  curators: Profile[];
  featuredCurators: Profile[];
  loading: boolean;
  userLoading: boolean;
  feedLoading: boolean;
  curatorsLoading: boolean;
  // Modal state
  isPickModalOpen: boolean;
  currentPickId: string | null;
  fetchProfile: (userId: string) => Promise<void>;
  fetchPicks: (userId: string) => Promise<void>;
  fetchUserData: (userId: string) => Promise<void>;
  fetchFeedPicks: () => Promise<void>;
  fetchFeaturedPicks: () => Promise<void>;
  fetchFeaturedCurators: () => Promise<void>;
  fetchCurators: () => Promise<void>;
  updateFeaturedPicks: (picks: Pick[]) => void;
  // Modal actions
  openPickModal: (pickId: string) => void;
  closePickModal: () => void;
  resetState: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  userProfile: null,
  userPicks: [],
  feedPicks: [],
  featuredPicks: [],
  curators: [],
  featuredCurators: [],
  loading: false,
  userLoading: false,
  feedLoading: false,
  curatorsLoading: false,
  // Modal state
  isPickModalOpen: false,
  currentPickId: null,

  fetchProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      if (data === null) {
        console.log('No profile found for user ID:', userId);
        set({ userProfile: null });
        return;
      }

      set({ userProfile: data });
      saveToCache(CACHE_KEYS.USER_PROFILE, data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  },

  fetchPicks: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('picks')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      // Sort picks by rank
      const sortedPicks = data.sort((a, b) => a.rank - b.rank);
      set({ userPicks: sortedPicks });
      saveToCache(CACHE_KEYS.USER_PICKS, sortedPicks);
    } catch (error) {
      console.error('Error fetching picks:', error);
    }
  },

  fetchUserData: async (userId: string) => {
    set({ userLoading: true });
    
    try {
      // Try cache first only if not expired
      if (!isCacheExpired(CACHE_KEYS.USER_PROFILE)) {
        const cachedProfile = getFromCache<Profile>(CACHE_KEYS.USER_PROFILE);
        const cachedPicks = getFromCache<Pick[]>(CACHE_KEYS.USER_PICKS);
        
        if (cachedProfile && cachedProfile.id === userId && cachedPicks) {
          console.log('Using cached user data for:', userId);
          set({ userProfile: cachedProfile, userPicks: cachedPicks });
        }
      }
      
      console.log('Fetching fresh user data for:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select(`*, picks(*)`)
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        const profile = { ...data, picks: undefined };
        const picks = data.picks || [];
        
        // Sort picks by rank (1, 2, 3)
        const sortedPicks = picks.sort((a: Pick, b: Pick) => {
          if (a.rank && b.rank) {
            return a.rank - b.rank;
          }
          return 0;
        });
        
        set({ userProfile: profile, userPicks: sortedPicks });
        
        // Cache the results
        saveToCache(CACHE_KEYS.USER_PROFILE, profile);
        saveToCache(CACHE_KEYS.USER_PICKS, sortedPicks);
      } else {
        set({ userProfile: null, userPicks: [] });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      set({ userLoading: false });
    }
  },

  fetchFeedPicks: async () => {
    const state = get();
    
    // Prevent duplicate requests
    if (state.feedLoading) {
      console.log('Feed picks fetch already in progress, skipping');
      return;
    }
    
    set({ feedLoading: true });
    
    try {
      // Try cache first only if not expired
      if (!isCacheExpired(CACHE_KEYS.FEED_PICKS)) {
        const cachedFeedPicks = getFromCache<any[]>(CACHE_KEYS.FEED_PICKS);
        if (cachedFeedPicks && cachedFeedPicks.length > 0) {
          console.log('Using cached feed picks:', cachedFeedPicks.length);
          set({ feedPicks: cachedFeedPicks });
        }
      }
      
      console.log('Fetching fresh feed picks from API');
      // Use a simpler query approach to avoid relationship issues
      const { data, error } = await supabase
        .from('picks')
        .select('*')
        .eq('status', 'published')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error in feed picks query:', error);
        return;
      }

      if (!data || data.length === 0) {
        console.log('No feed picks found');
        set({ feedPicks: [] });
        return;
      }
      
      console.log('Feed picks found:', data.length);
      
      // Now fetch the user profiles for these picks
      const profileIds = [...new Set(data.map(pick => pick.profile_id).filter(id => id !== undefined && id !== null))];
      
      if (profileIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', profileIds);
          
        if (profilesError) {
          console.error('Error fetching profiles for feed picks:', profilesError);
        } else if (profilesData) {
          console.log('Fetched profiles for feed picks:', profilesData.length);
          
          // Create a map of profiles by ID for quick lookup
          const profilesMap = profilesData.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {} as Record<string, any>);
          
          // Attach profile data to each pick
          const picksWithProfiles = data.map(pick => ({
            ...pick,
            profile: profilesMap[pick.profile_id] || null
          }));
          
          set({ feedPicks: picksWithProfiles });
          saveToCache(CACHE_KEYS.FEED_PICKS, picksWithProfiles);
          return;
        }
      }
      
      // If we couldn't fetch profiles or there was an error, just use the picks data
      set({ feedPicks: data });
      saveToCache(CACHE_KEYS.FEED_PICKS, data);
    } catch (error) {
      console.error('Error fetching feed picks:', error);
    } finally {
      set({ feedLoading: false });
    }
  },

  fetchFeaturedPicks: async () => {
    const state = get();
    
    // Prevent duplicate requests
    if (state.feedLoading) {
      console.log('Featured picks fetch already in progress, skipping');
      return;
    }
    
    set({ feedLoading: true });
    
    try {
      // Try cache first only if not expired
      if (!isCacheExpired(CACHE_KEYS.FEATURED_PICKS)) {
        const cachedFeaturedPicks = getFromCache<Pick[]>(CACHE_KEYS.FEATURED_PICKS);
        if (cachedFeaturedPicks && cachedFeaturedPicks.length > 0) {
          console.log('Using cached featured picks:', cachedFeaturedPicks.length);
          set({ featuredPicks: cachedFeaturedPicks });
        }
      }
      
      console.log('Fetching fresh featured picks from API');
      // First get the picks
      const { data: picksData, error: picksError } = await supabase
        .from('picks')
        .select('*')
        .eq('is_featured', true)
        .eq('status', 'published')
        .order('updated_at', { ascending: false });

      if (picksError) {
        console.error('Error in featured picks query:', picksError);
        return;
      }

      if (!picksData || picksData.length === 0) {
        console.log('No featured picks found');
        set({ featuredPicks: [] });
        return;
      }
      
      console.log('Featured picks found:', picksData.length);
      
      // Now fetch the user profiles for these picks
      const userIds = [...new Set(picksData.map(pick => pick.user_id).filter(id => id !== undefined && id !== null))];
      
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
          
        if (profilesError) {
          console.error('Error fetching profiles for picks:', profilesError);
        } else if (profilesData) {
          console.log('Fetched profiles for picks:', profilesData.length);
          
          // Create a map of profiles by ID for quick lookup
          const profilesMap = profilesData.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {} as Record<string, any>);
          
          // Attach profile data to each pick
          const picksWithProfiles = picksData.map(pick => ({
            ...pick,
            profile: profilesMap[pick.user_id] || null
          }));
          
          set({ featuredPicks: picksWithProfiles });
          saveToCache(CACHE_KEYS.FEATURED_PICKS, picksWithProfiles);
          return;
        }
      }
      
      // If we couldn't fetch profiles or there was an error, just use the picks data
      set({ featuredPicks: picksData });
      saveToCache(CACHE_KEYS.FEATURED_PICKS, picksData);
    } catch (error) {
      console.error('Error fetching featured picks:', error);
    } finally {
      set({ feedLoading: false });
    }
  },

  fetchFeaturedCurators: async () => {
    const state = get();
    
    // Prevent duplicate requests
    if (state.curatorsLoading) {
      console.log('Featured curators fetch already in progress, skipping');
      return;
    }
    
    set({ curatorsLoading: true });
    
    try {
      // Try cache first only if not expired
      if (!isCacheExpired(CACHE_KEYS.FEATURED_CURATORS)) {
        const cachedFeaturedCurators = getFromCache<Profile[]>(CACHE_KEYS.FEATURED_CURATORS);
        if (cachedFeaturedCurators && cachedFeaturedCurators.length > 0) {
          console.log('Using cached featured curators:', cachedFeaturedCurators.length);
          set({ featuredCurators: cachedFeaturedCurators });
        }
      }

      console.log('Fetching fresh featured curators from API');
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          picks (*)
        `)
        .eq('is_featured', true)
        .eq('status', 'active');

      if (error) {
        console.error('Error in featured curators query:', error);
        return;
      }

      if (!data || data.length === 0) {
        console.log('No featured curators found');
        set({ featuredCurators: [] });
        return;
      }

      console.log('Featured curators found:', data.length);
      
      // Process curators - include all featured profiles
      const processedCurators = data
        .map((curator: any) => {
          // Filter to only include published picks
          const publishedPicks = curator.picks
            ? curator.picks.filter((pick: any) => pick.status === 'published')
            : [];
          
          // Return curator with only published picks
          return {
            ...curator,
            picks: publishedPicks
          };
        });
      
      console.log('Processed featured curators:', processedCurators.length);
      set({ featuredCurators: processedCurators });
      
      // Cache the results
      saveToCache(CACHE_KEYS.FEATURED_CURATORS, processedCurators);
    } catch (error) {
      console.error('Error fetching featured curators:', error);
    } finally {
      set({ curatorsLoading: false });
    }
  },

  fetchCurators: async () => {
    const state = get();
    
    // Prevent duplicate requests
    if (state.curatorsLoading) {
      console.log('Curators fetch already in progress, skipping');
      return;
    }
    
    set({ curatorsLoading: true });
    
    try {
      // Try cache first only if not expired
      if (!isCacheExpired(CACHE_KEYS.CURATORS)) {
        const cachedCurators = getFromCache<Profile[]>(CACHE_KEYS.CURATORS);
        if (cachedCurators && cachedCurators.length > 0) {
          console.log('Using cached curators:', cachedCurators.length);
          set({ curators: cachedCurators });
        }
      }
      
      console.log('Fetching fresh curators from API');
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          picks (*)
        `)
        .in('status', ['active', 'approved'])
        .not('picks', 'is', null);

      if (error) {
        console.error('Error in curators query:', error);
        return;
      }

      if (!data || data.length === 0) {
        console.log('No curators found with active/approved status and picks');
        
        // Fallback: try to get all profiles with picks
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .select(`
            *,
            picks (*)
          `)
          .not('picks', 'is', null);
          
        if (fallbackError) {
          console.error('Error in fallback curators query:', fallbackError);
          set({ curators: [] });
          return;
        }
        
        if (!fallbackData || fallbackData.length === 0) {
          console.log('No curators found at all');
          set({ curators: [] });
          return;
        }
        
        console.log('Fallback curators found:', fallbackData.length);
        
        // Process fallback curators
        const processedFallbackCurators = fallbackData
          .map((curator: any) => {
            // Filter to only include published picks
            const publishedPicks = curator.picks
              ? curator.picks.filter((pick: any) => pick.status === 'published')
              : [];
            
            // Return curator with only published picks
            return {
              ...curator,
              picks: publishedPicks
            };
          })
          .filter((curator: any) => curator.picks.length > 0) // Only include curators with published picks
          .sort((a: any, b: any) => {
            // Sort by number of picks (descending)
            return (b.picks?.length || 0) - (a.picks?.length || 0);
          });
          
        console.log('Processed fallback curators:', processedFallbackCurators.length);
        set({ curators: processedFallbackCurators });
        
        // Cache the results
        saveToCache(CACHE_KEYS.CURATORS, processedFallbackCurators);
        return;
      }

      console.log('Curators found:', data.length);
      
      // Process curators - include all active/approved profiles
      const processedCurators = data
        .map((curator: any) => {
          // Filter to only include published picks
          const publishedPicks = curator.picks
            ? curator.picks.filter((pick: any) => pick.status === 'published')
            : [];
          
          // Return curator with only published picks
          return {
            ...curator,
            picks: publishedPicks
          };
        })
        .filter((curator: any) => curator.picks.length > 0) // Only include curators with published picks
        .sort((a: any, b: any) => {
          // Sort by number of picks (descending)
          return (b.picks?.length || 0) - (a.picks?.length || 0);
        });
      
      console.log('Processed curators:', processedCurators.length);
      set({ curators: processedCurators });
      
      // Cache the results
      saveToCache(CACHE_KEYS.CURATORS, processedCurators);
    } catch (error) {
      console.error('Error fetching curators:', error);
    } finally {
      set({ curatorsLoading: false });
    }
  },

  updateFeaturedPicks: (picks) => {
    set({ featuredPicks: picks });
  },

  // Modal actions
  openPickModal: (pickId) => {
    set({ isPickModalOpen: true, currentPickId: pickId });
  },

  closePickModal: () => {
    set({ isPickModalOpen: false, currentPickId: null });
  },

  resetState: () => {
    console.log('Resetting app state and clearing cache');
    // Clear all cached data
    clearCache();
    
    set({
      userProfile: null,
      userPicks: [],
      feedPicks: [],
      featuredPicks: [],
      curators: [],
      featuredCurators: [],
      loading: false,
      userLoading: false,
      feedLoading: false,
      curatorsLoading: false,
      isPickModalOpen: false,
      currentPickId: null,
    });
  },
}));

// Export the store as useAppStore to maintain compatibility with existing code
export const useAppStore = useStore;
