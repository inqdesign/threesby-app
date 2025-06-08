import { create } from 'zustand'; // Updated import
import { supabase } from './lib/supabase';
import type { Profile, Pick } from './types';

interface AppState {
  userProfile: Profile | null;
  userPicks: Pick[];
  feedPicks: Pick[];
  featuredPicks: Pick[];
  curators: Profile[];
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
}

export const useAppStore = create<AppState>((set) => ({
  userProfile: null,
  userPicks: [],
  feedPicks: [],
  featuredPicks: [],
  curators: [],
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
    } catch (error) {
      console.error('Error fetching profile:', error);
      set({ userProfile: null });
    }
  },

  fetchPicks: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('picks')
        .select('*')
        .eq('profile_id', userId)
        .order('rank', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ userPicks: data || [] });
    } catch (error) {
      console.error('Error fetching picks:', error);
      set({ userPicks: [] });
    }
  },

  fetchUserData: async (userId: string) => {
    set({ userLoading: true });
    try {
      // Use a single query with joins instead of multiple queries for better performance
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          picks(*)
        `)
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      
      if (data === null) {
        console.log('No profile found for user ID in fetchUserData:', userId);
        set({ userProfile: null, userPicks: [], userLoading: false });
        return;
      }
      
      // Extract picks from the joined data and sort them
      const picks = data.picks || [];
      const sortedPicks = picks.sort((a: Pick, b: Pick) => {
        // First sort by rank (ascending)
        if (a.rank !== b.rank) {
          return a.rank - b.rank;
        }
        // Then by creation date (descending)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      set({
        userProfile: data,
        userPicks: sortedPicks,
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      set({ userProfile: null, userPicks: [] });
    } finally {
      set({ userLoading: false });
    }
  },

  fetchFeedPicks: async () => {
    try {
      set({ feedLoading: true });
      
      // First, get Eunggyu Lee's profile ID
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('full_name', 'Eunggyu Lee')
        .maybeSingle();
      
      if (!profileData) {
        console.log('Eunggyu Lee profile not found');
        set({ feedPicks: [], feedLoading: false });
        return;
      }
      
      const eunggyuId = profileData.id;
      console.log('Eunggyu Lee profile ID:', eunggyuId);
      
      // First, fetch ALL book picks with no filters except rank=0
      const { data: bookData, error: bookError } = await supabase
        .from('picks')
        .select(`
          id,
          profile_id,
          category,
          title,
          description,
          image_url,
          reference,
          created_at,
          updated_at,
          status,
          visible,
          rank,
          profiles (
            id,
            full_name,
            title,
            avatar_url,
            is_admin,
            is_creator,
            is_brand
          )
        `)
        .eq('category', 'books')
        .neq('rank', 0) // Exclude picks with rank=0
        // No status filter
        // No visibility filter
        .order('created_at', { ascending: false });
        
      // Specifically fetch Eunggyu Lee's book picks if we have his ID
      let eunggyuBooks: Pick[] = [];
      if (eunggyuId) {
        const { data: eunggyuData } = await supabase
          .from('picks')
          .select(`
            id,
            profile_id,
            category,
            title,
            description,
            image_url,
            reference,
            created_at,
            updated_at,
            status,
            visible,
            rank,
            profiles (
              id,
              full_name,
              title,
              avatar_url,
              is_admin,
              is_creator,
              is_brand
            )
          `)
          .eq('profile_id', eunggyuId)
          .eq('category', 'books')
          .neq('rank', 0); // Exclude picks with rank=0
          
        eunggyuBooks = eunggyuData || [];
        console.log('Eunggyu Lee book picks:', eunggyuBooks);
      }
      
      if (bookError) throw bookError;
      
      // Then fetch all other picks
      const { data: otherData, error } = await supabase
        .from('picks')
        .select(`
          id,
          profile_id,
          category,
          title,
          description,
          image_url,
          reference,
          created_at,
          updated_at,
          status,
          visible,
          rank,
          profiles (
            id,
            full_name,
            title,
            avatar_url,
            is_admin,
            is_creator,
            is_brand
          )
        `)
        .eq('status', 'published')
        .neq('rank', 0) // Exclude picks with rank=0
        .order('updated_at', { ascending: false }) // Sort by most recent update date
        .limit(50);
        
      // Combine the results, ensuring books are included, with Eunggyu's books having priority
      const combinedData = [...(eunggyuBooks || []), ...(bookData || []), ...(otherData || [])];
      // Remove duplicates by ID
      const uniqueData = Array.from(new Map(combinedData.map(item => [item.id, item])).values());

      if (error) throw error;
      // Use the uniqueData to avoid duplicates
      set({ feedPicks: uniqueData, feedLoading: false });
      
      // Log the final data for debugging
      console.log('Final feed picks count:', uniqueData.length);
      console.log('Books count:', uniqueData.filter(pick => pick.category === 'books').length);
    } catch (error) {
      console.error('Error fetching feed picks:', error);
      set({ feedPicks: [], feedLoading: false });
    }
  },

  fetchFeaturedPicks: async () => {
    try {
      const { data, error } = await supabase
        .from('picks')
        .select('*')
        .eq('is_featured', true)
        .eq('visible', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ featuredPicks: data || [] });
    } catch (error) {
      console.error('Error fetching featured picks:', error);
      set({ featuredPicks: [] });
    }
  },

  fetchFeaturedCurators: async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          picks (*)
        `)
        .eq('is_featured', true)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ curators: data || [] });
    } catch (error) {
      console.error('Error fetching featured curators:', error);
      set({ curators: [] });
    }
  },

  fetchCurators: async () => {
    try {
      // Always set loading state to true to show skeletons while refreshing
      set({ curatorsLoading: true, curators: [] });
      
      console.log('Fetching curators data...');
      
      // Query to get only active/published profiles with their picks
      // According to new rules, only profiles with status 'active' should be visible
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          picks(*)
        `)
        .eq('status', 'active') // Only get active profiles (previously published/approved)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) {
        console.error('Error fetching curators:', error);
        throw error;
      }
      
      console.log('Raw curators data received:', data?.length || 0, 'active profiles');
      
      // If no active profiles found, check for admin/creator profiles
      if (!data || data.length === 0) {
        console.log('No active profiles found, checking for admin/creator profiles');
        
        const { data: adminProfiles, error: adminError } = await supabase
          .from('profiles')
          .select(`
            *,
            picks(*)
          `)
          .or('is_admin.eq.true,is_creator.eq.true') // Get admin or creator profiles
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (adminError) {
          console.error('Error fetching admin profiles:', adminError);
          set({ curators: [], curatorsLoading: false });
          return;
        }
        
        if (adminProfiles && adminProfiles.length > 0) {
          processAndSetCurators(adminProfiles);
          return;
        }
        
        // If still no data, just get any profiles as a fallback
        console.log('No admin profiles found, getting any profiles as fallback');
        const { data: anyProfiles, error: anyProfilesError } = await supabase
          .from('profiles')
          .select(`
            *,
            picks(*)
          `)
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (anyProfilesError) {
          console.error('Error fetching any profiles:', anyProfilesError);
          set({ curators: [], curatorsLoading: false });
          return;
        }
        
        if (anyProfiles && anyProfiles.length > 0) {
          processAndSetCurators(anyProfiles);
          return;
        }
        
        // If we still don't have data, give up
        console.log('No profiles found at all');
        set({ curators: [], curatorsLoading: false });
        return;
      }
      
      // Process the active profiles we found initially
      processAndSetCurators(data);
      
    } catch (error) {
      console.error('Error fetching curators:', error);
      set({ curators: [], curatorsLoading: false });
    }
    
    // Helper function to process and set curators
    function processAndSetCurators(data: any[]) {
      // Process and filter the data
      const processedCurators = data.map(curator => {
        // Ensure picks is always an array
        const picks = Array.isArray(curator.picks) ? curator.picks : [];
        
        // NEW RULE: Profile status controls overall visibility, pick status controls individual visibility
        // 1. If viewing own profile or admin/creator, show all picks (including drafts)
        // 2. If profile is active, show only published picks
        // 3. Otherwise, don't show any picks
        const validPicks = picks.filter((pick: any) => {
          // Admin/creator can see all their picks regardless of status
          if (curator.is_admin || curator.is_creator) {
            return true;
          }
          
          // For active profiles, only show published picks to others
          if (curator.status === 'approved') {
            return pick.status === 'published';
          }
          
          // For all other profiles, don't show picks
          return false;
        });
        
        console.log(`Curator ${curator.full_name || curator.id} has ${validPicks.length} valid picks`);
        
        // Sort picks to match the exact order shown in the UI
        const sortedPicks = [...validPicks].sort((a: Pick, b: Pick) => {
          // First, prioritize picks with ranks 1-3
          const aIsTopPick = a.rank >= 1 && a.rank <= 3;
          const bIsTopPick = b.rank >= 1 && b.rank <= 3;
          
          if (aIsTopPick && !bIsTopPick) return -1;
          if (!aIsTopPick && bIsTopPick) return 1;
          
          // For top picks (ranks 1-3), sort by rank ascending (1, 2, 3)
          if (aIsTopPick && bIsTopPick) {
            return a.rank - b.rank;
          }
          
          // For other picks, sort by updated date
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });
        
        return {
          ...curator,
          picks: sortedPicks
        };
      });
      
      // Filter to only include curators with at least one valid pick
      // For active profiles, they must have 9 picks (3 per category)
      const curatorsWithPicks = processedCurators.filter(curator => {
        // Admin/creator profiles are always included regardless of pick count
        if (curator.is_admin || curator.is_creator) {
          return Array.isArray(curator.picks) && curator.picks.length > 0;
        }
        
        // Approved profiles must have at least 9 picks
        if (curator.status === 'approved') {
          return Array.isArray(curator.picks) && curator.picks.length >= 9;
        }
        
        // Other profiles are not included
        return false;
      });
      
      console.log('Processed curators with picks:', curatorsWithPicks.length);
      
      // Set the curators in the store
      set({ curators: curatorsWithPicks, curatorsLoading: false });
    }
  },

  updateFeaturedPicks: (picks: Pick[]) => {
    set({ featuredPicks: picks });
  },

  // Modal actions
  openPickModal: (pickId: string) => {
    set({ isPickModalOpen: true, currentPickId: pickId });
  },

  closePickModal: () => {
    set({ isPickModalOpen: false, currentPickId: null });
  },
}));