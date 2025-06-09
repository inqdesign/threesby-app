import { create } from 'zustand';
import { supabase } from './lib/supabase';
import type { Profile, Pick } from './types';
import { saveToCache, getFromCache, CACHE_KEYS, clearCache, isCacheExpired, forceCacheRefresh, clearCuratorsCache } from './lib/cacheUtils';

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
      const retryDelay = Math.floor(delay * Math.pow(RETRY_CONFIG.retryMultiplier, attempt - 1));
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  throw new Error('Retry logic failed');
}

// Chrome detection
const isChrome = typeof navigator !== 'undefined' && 
  /Chrome/.test(navigator.userAgent) && 
  /Google Inc/.test(navigator.vendor);

// Loading operations tracker to prevent duplicate requests
const loadingOperations = new Set<string>();

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
          .eq('profile_id', userId);

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
    const operationKey = 'feedPicks';
    
    if (loadingOperations.has(operationKey) && !force) {
      return;
    }

    try {
      loadingOperations.add(operationKey);
      set((state) => ({ ...state, feedLoading: true, error: null }));
      
      // Force cache clearing if requested
      if (force) {
        forceCacheRefresh(CACHE_KEYS.FEED_PICKS);
      }

      // Try cache first unless force refresh
      if (!force) {
        const cachedPicks = getFromCache<Pick[]>(CACHE_KEYS.FEED_PICKS);
        if (cachedPicks && cachedPicks.length > 0) {

          set((state) => ({ 
            ...state, 
            feedPicks: cachedPicks, 
            feedLoading: false 
          }));
          return;
        }
      }

      const picks = await withRetry(async () => {
        const { data, error } = await supabase
          .from('picks')
          .select(`
            *,
            profiles (
              id,
              full_name,
              email,
              avatar_url,
              title,
              is_admin,
              is_creator
            )
          `)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        return data || [];
      });

      // Save to cache
      saveToCache(CACHE_KEYS.FEED_PICKS, picks);
      
      set((state) => ({ 
        ...state, 
        feedPicks: picks, 
        feedLoading: false,
        error: null 
      }));
      

      
    } catch (error) {
      console.error('Error fetching feed picks:', error);
      set((state) => ({ 
        ...state, 
        feedLoading: false, 
        error: 'Failed to load feed picks' 
      }));
    } finally {
      loadingOperations.delete(operationKey);
    }
  },

  fetchFeaturedPicks: async (force = false) => {
    const operationKey = 'featuredPicks';
    
    if (loadingOperations.has(operationKey) && !force) {
      return;
    }

    try {
      loadingOperations.add(operationKey);
      set((state) => ({ ...state, featuredLoading: true, error: null }));
      

      
      // Force cache clearing if requested
      if (force) {
        forceCacheRefresh(CACHE_KEYS.FEATURED_PICKS);
      }

      // Try cache first unless force refresh
      if (!force) {
        const cachedPicks = getFromCache<Pick[]>(CACHE_KEYS.FEATURED_PICKS);
        if (cachedPicks && cachedPicks.length > 0) {

          set((state) => ({ 
            ...state, 
            featuredPicks: cachedPicks, 
            featuredLoading: false 
          }));
          return;
        }
      }

      const picks = await withRetry(async () => {
        const { data, error } = await supabase
          .from('picks')
          .select(`
            *,
            profiles (
              id,
              full_name,
              email,
              avatar_url,
              title,
              is_admin,
              is_creator
            )
          `)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        return data || [];
      });

      // Save to cache
      saveToCache(CACHE_KEYS.FEATURED_PICKS, picks);
      
      set((state) => ({ 
        ...state, 
        featuredPicks: picks, 
        featuredLoading: false,
        error: null 
      }));
      

      
    } catch (error) {
      console.error('Error fetching featured picks:', error);
      set((state) => ({ 
        ...state, 
        featuredLoading: false, 
        error: 'Failed to load featured picks' 
      }));
    } finally {
      loadingOperations.delete(operationKey);
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
    
    if (loadingOperations.has(operationKey) && !force) {
      return;
    }

    try {
      loadingOperations.add(operationKey);
      set((state) => ({ ...state, curatorsLoading: true, error: null }));
      

      
      // Force cache clearing if requested
      if (force) {
        clearCuratorsCache();
      }

      // Always force fetch for curators to ensure fresh data
      const curators = await withRetry(async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            *,
            picks (*)
          `)
          .in('status', ['active', 'approved', 'pending'])
          .eq('is_creator', true)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        return data || [];
      });

      // Process curators - include only published picks
      const processedCurators = curators
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
        // Only include curators that have at least one published pick
        .filter((curator: any) => curator.picks && curator.picks.length > 0);

      // Save to cache
      saveToCache(CACHE_KEYS.CURATORS, processedCurators);
      
      set((state) => ({ 
        ...state, 
        curators: processedCurators, 
        curatorsLoading: false,
        error: null 
      }));
      

      
    } catch (error) {
      console.error('Error fetching curators:', error);
      set((state) => ({ 
        ...state, 
        curatorsLoading: false, 
        error: 'Failed to load curators' 
      }));
    } finally {
      loadingOperations.delete(operationKey);
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
