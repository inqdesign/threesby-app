import { create } from 'zustand';
import { supabase } from './lib/supabase';
import type { Profile, Pick } from './types';
import { saveToCache, getFromCache, CACHE_KEYS, clearCache, isCacheExpired, forceCacheRefresh } from './lib/cacheUtils';

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryMultiplier: 1.5
};

// Helper function to retry async operations
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = RETRY_CONFIG.maxRetries,
  delay: number = RETRY_CONFIG.retryDelay
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying, with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(RETRY_CONFIG.retryMultiplier, attempt - 1)));
    }
  }
  throw new Error('Retry logic failed');
}

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
  featuredLoading: boolean;
  curatorsLoading: boolean;
  // Loading tracking for duplicates
  loadingOperations: Set<string>;
  // Modal state
  isPickModalOpen: boolean;
  currentPickId: string | null;
  fetchProfile: (userId: string) => Promise<void>;
  fetchPicks: (userId: string) => Promise<void>;
  fetchUserData: (userId: string) => Promise<void>;
  fetchFeedPicks: (force?: boolean) => Promise<void>;
  fetchFeaturedPicks: (force?: boolean) => Promise<void>;
  fetchFeaturedCurators: (force?: boolean) => Promise<void>;
  fetchCurators: (force?: boolean) => Promise<void>;
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
  featuredLoading: false,
  curatorsLoading: false,
  loadingOperations: new Set(),
  // Modal state
  isPickModalOpen: false,
  currentPickId: null,

  fetchProfile: async (userId: string) => {
    try {
      const result = await withRetry(async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) throw error;
        return data;
      });

      if (result === null) {
        console.log('No profile found for user ID:', userId);
        set({ userProfile: null });
        return;
      }

      set({ userProfile: result });
      saveToCache(CACHE_KEYS.USER_PROFILE, result);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  },

  fetchPicks: async (userId: string) => {
    try {
      const result = await withRetry(async () => {
        const { data, error } = await supabase
          .from('picks')
          .select('*')
          .eq('user_id', userId);

        if (error) throw error;
        return data;
      });

      // Sort picks by rank
      const sortedPicks = result.sort((a, b) => a.rank - b.rank);
      set({ userPicks: sortedPicks });
      saveToCache(CACHE_KEYS.USER_PICKS, sortedPicks);
    } catch (error) {
      console.error('Error fetching picks:', error);
    }
  },

  fetchUserData: async (userId: string) => {
    const operationKey = `user-data-${userId}`;
    const state = get();
    
    // Prevent duplicate requests
    if (state.loadingOperations.has(operationKey) || state.userLoading) {
      console.log('User data fetch already in progress, skipping');
      return;
    }
    
    set({ 
      userLoading: true,
      loadingOperations: new Set(state.loadingOperations).add(operationKey)
    });
    
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
      const result = await withRetry(async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select(`*, picks(*)`)
          .eq('id', userId)
          .maybeSingle();

        if (error) throw error;
        return data;
      });
      
      if (result) {
        const profile = { ...result, picks: undefined };
        const picks = result.picks || [];
        
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
      const newOperations = new Set(state.loadingOperations);
      newOperations.delete(operationKey);
      set({ 
        userLoading: false,
        loadingOperations: newOperations
      });
    }
  },

  fetchFeedPicks: async (force = false) => {
    const operationKey = 'feed-picks';
    const state = get();
    
    // Prevent duplicate requests
    if (state.loadingOperations.has(operationKey) || state.feedLoading) {
      console.log('Feed picks fetch already in progress, skipping');
      return;
    }
    
    set({ 
      feedLoading: true,
      loadingOperations: new Set(state.loadingOperations).add(operationKey)
    });
    
    try {
      // Force refresh if requested
      if (force) {
        forceCacheRefresh(CACHE_KEYS.FEED_PICKS);
      }
      
      // Try cache first only if not expired and not forced
      if (!force && !isCacheExpired(CACHE_KEYS.FEED_PICKS)) {
        const cachedFeedPicks = getFromCache<any[]>(CACHE_KEYS.FEED_PICKS);
        if (cachedFeedPicks && cachedFeedPicks.length > 0) {
          console.log('Using cached feed picks:', cachedFeedPicks.length);
          set({ feedPicks: cachedFeedPicks });
        }
      }
      
      console.log('Fetching fresh feed picks from API');
      
      const picksData = await withRetry(async () => {
        const { data, error } = await supabase
          .from('picks')
          .select('*')
          .eq('status', 'published')
          .order('updated_at', { ascending: false });

        if (error) throw error;
        return data;
      });

      if (!picksData || picksData.length === 0) {
        console.log('No feed picks found');
        set({ feedPicks: [] });
        return;
      }
      
      console.log('Feed picks found:', picksData.length);
      
      // Now fetch the user profiles for these picks
      const profileIds = [...new Set(picksData.map(pick => pick.profile_id).filter(id => id !== undefined && id !== null))];
      
      if (profileIds.length > 0) {
        const profilesData = await withRetry(async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .in('id', profileIds);
            
          if (error) throw error;
          return data;
        });
          
        if (profilesData) {
          console.log('Fetched profiles for feed picks:', profilesData.length);
          
          // Create a map of profiles by ID for quick lookup
          const profilesMap = profilesData.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {} as Record<string, any>);
          
          // Attach profile data to each pick
          const picksWithProfiles = picksData.map(pick => ({
            ...pick,
            profile: profilesMap[pick.profile_id] || null
          }));
          
          set({ feedPicks: picksWithProfiles });
          saveToCache(CACHE_KEYS.FEED_PICKS, picksWithProfiles);
          return;
        }
      }
      
      // If we couldn't fetch profiles or there was an error, just use the picks data
      set({ feedPicks: picksData });
      saveToCache(CACHE_KEYS.FEED_PICKS, picksData);
    } catch (error) {
      console.error('Error fetching feed picks:', error);
    } finally {
      const newOperations = new Set(state.loadingOperations);
      newOperations.delete(operationKey);
      set({ 
        feedLoading: false,
        loadingOperations: newOperations
      });
    }
  },

  fetchFeaturedPicks: async (force = false) => {
    const operationKey = 'featured-picks';
    const state = get();
    
    // Prevent duplicate requests
    if (state.loadingOperations.has(operationKey) || state.featuredLoading) {
      console.log('Featured picks fetch already in progress, skipping');
      return;
    }
    
    set({ 
      featuredLoading: true,
      loadingOperations: new Set(state.loadingOperations).add(operationKey)
    });
    
    try {
      // Force refresh if requested
      if (force) {
        forceCacheRefresh(CACHE_KEYS.FEATURED_PICKS);
      }
      
      // Try cache first only if not expired and not forced
      if (!force && !isCacheExpired(CACHE_KEYS.FEATURED_PICKS)) {
        const cachedFeaturedPicks = getFromCache<Pick[]>(CACHE_KEYS.FEATURED_PICKS);
        if (cachedFeaturedPicks && cachedFeaturedPicks.length > 0) {
          console.log('Using cached featured picks:', cachedFeaturedPicks.length);
          set({ featuredPicks: cachedFeaturedPicks });
        }
      }
      
      console.log('Fetching fresh featured picks from API');
      
      const picksData = await withRetry(async () => {
        const { data, error } = await supabase
          .from('picks')
          .select('*')
          .eq('is_featured', true)
          .eq('status', 'published')
          .order('updated_at', { ascending: false });

        if (error) throw error;
        return data;
      });

      if (!picksData || picksData.length === 0) {
        console.log('No featured picks found');
        set({ featuredPicks: [] });
        return;
      }
      
      console.log('Featured picks found:', picksData.length);
      
      // Now fetch the user profiles for these picks
      const userIds = [...new Set(picksData.map(pick => pick.user_id).filter(id => id !== undefined && id !== null))];
      
      if (userIds.length > 0) {
        const profilesData = await withRetry(async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds);
            
          if (error) throw error;
          return data;
        });
          
        if (profilesData) {
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
      const newOperations = new Set(state.loadingOperations);
      newOperations.delete(operationKey);
      set({ 
        featuredLoading: false,
        loadingOperations: newOperations
      });
    }
  },

  fetchFeaturedCurators: async (force = false) => {
    const operationKey = 'featured-curators';
    const state = get();
    
    // Prevent duplicate requests
    if (state.loadingOperations.has(operationKey) || state.curatorsLoading) {
      console.log('Featured curators fetch already in progress, skipping');
      return;
    }
    
    set({ 
      curatorsLoading: true,
      loadingOperations: new Set(state.loadingOperations).add(operationKey)
    });
    
    try {
      // Force refresh if requested
      if (force) {
        forceCacheRefresh(CACHE_KEYS.FEATURED_CURATORS);
      }
      
      // Try cache first only if not expired and not forced
      if (!force && !isCacheExpired(CACHE_KEYS.FEATURED_CURATORS)) {
        const cachedFeaturedCurators = getFromCache<Profile[]>(CACHE_KEYS.FEATURED_CURATORS);
        if (cachedFeaturedCurators && cachedFeaturedCurators.length > 0) {
          console.log('Using cached featured curators:', cachedFeaturedCurators.length);
          set({ featuredCurators: cachedFeaturedCurators });
        }
      }

      console.log('Fetching fresh featured curators from API');
      
      const result = await withRetry(async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            *,
            picks (*)
          `)
          .eq('is_featured', true)
          .eq('status', 'active');

        if (error) throw error;
        return data;
      });

      if (!result || result.length === 0) {
        console.log('No featured curators found');
        set({ featuredCurators: [] });
        return;
      }

      console.log('Featured curators found:', result.length);
      
      // Process curators - include all active profiles
      const processedCurators = result
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

      set({ featuredCurators: processedCurators });
      saveToCache(CACHE_KEYS.FEATURED_CURATORS, processedCurators);
    } catch (error) {
      console.error('Error fetching featured curators:', error);
    } finally {
      const newOperations = new Set(state.loadingOperations);
      newOperations.delete(operationKey);
      set({ 
        curatorsLoading: false,
        loadingOperations: newOperations
      });
    }
  },

  fetchCurators: async (force = false) => {
    const operationKey = 'curators';
    const state = get();
    
    // Prevent duplicate requests
    if (state.loadingOperations.has(operationKey) || state.curatorsLoading) {
      console.log('Curators fetch already in progress, skipping');
      return;
    }
    
    set({ 
      curatorsLoading: true,
      loadingOperations: new Set(state.loadingOperations).add(operationKey)
    });
    
    try {
      // Force refresh if requested
      if (force) {
        forceCacheRefresh(CACHE_KEYS.CURATORS);
      }
      
      // Try cache first only if not expired and not forced
      if (!force && !isCacheExpired(CACHE_KEYS.CURATORS)) {
        const cachedCurators = getFromCache<Profile[]>(CACHE_KEYS.CURATORS);
        if (cachedCurators && cachedCurators.length > 0) {
          console.log('Using cached curators:', cachedCurators.length);
          set({ curators: cachedCurators });
        }
      }

      console.log('Fetching fresh curators from API');
      
      const result = await withRetry(async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            *,
            picks (*)
          `)
          .in('status', ['active', 'approved', 'published']); // More inclusive status check

        if (error) throw error;
        return data;
      });

      if (!result || result.length === 0) {
        console.log('No curators found');
        set({ curators: [] });
        return;
      }

      console.log('Curators found:', result.length);
      
      // Process curators - include all profiles with picks
      const processedCurators = result
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
        .filter((curator: any) => {
          // Only include curators that have at least one published pick
          return curator.picks && curator.picks.length > 0;
        });

      console.log('Processed curators with picks:', processedCurators.length);
      set({ curators: processedCurators });
      saveToCache(CACHE_KEYS.CURATORS, processedCurators);
    } catch (error) {
      console.error('Error fetching curators:', error);
    } finally {
      const newOperations = new Set(state.loadingOperations);
      newOperations.delete(operationKey);
      set({ 
        curatorsLoading: false,
        loadingOperations: newOperations
      });
    }
  },

  updateFeaturedPicks: (picks: Pick[]) => {
    set({ featuredPicks: picks });
    saveToCache(CACHE_KEYS.FEATURED_PICKS, picks);
  },

  // Modal actions
  openPickModal: (pickId: string) => {
    set({ isPickModalOpen: true, currentPickId: pickId });
  },

  closePickModal: () => {
    set({ isPickModalOpen: false, currentPickId: null });
  },

  resetState: () => {
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
      featuredLoading: false,
      curatorsLoading: false,
      loadingOperations: new Set(),
      isPickModalOpen: false,
      currentPickId: null,
    });
    clearCache();
  },
}));

// Export the store with a more specific name to avoid confusion
export const useAppStore = useStore;
