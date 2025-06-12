import { supabase } from '../lib/supabase';
import type { Pick as PickType } from '../types';

// Temporary local storage for favorites as fallback
const localFavorites = new Map<string, Set<string>>();

// Try database first, fallback to local storage only if database fails
let useLocalStorage = false;

/**
 * Add a pick to the user's favorites
 * @param pickId The ID of the pick to favorite
 * @returns The result of the operation
 */
export const savePick = async (pickId: string): Promise<any> => {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }
  
  try {
    if (useLocalStorage) {
      // Use local storage implementation
      if (!localFavorites.has(user.user.id)) {
        localFavorites.set(user.user.id, new Set());
      }
      localFavorites.get(user.user.id)?.add(pickId);
      return [{ id: crypto.randomUUID(), user_id: user.user.id, pick_id: pickId }];
    }
    
    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: user.user.id,
        pick_id: pickId
      })
      .select();
      
    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST204') { // Table doesn't exist or permission error
        console.warn('Favorites table not available, using local storage fallback');
        useLocalStorage = true;
        return await savePick(pickId);
      }
      console.error('Error saving pick to database:', error);
      throw error;
    }
    
    console.log('Successfully saved pick to database:', data);
    return data;
  } catch (error) {
    console.error('Error saving pick:', error);
    // Fallback to local storage
    console.warn('Falling back to local storage for favorites');
    useLocalStorage = true;
    return await savePick(pickId);
  }
};

/**
 * Remove a pick from the user's favorites
 * @param pickId The ID of the pick to unfavorite
 * @returns The result of the operation
 */
export const unsavePick = async (pickId: string): Promise<any> => {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }
  
  try {
    if (useLocalStorage) {
      // Use local storage implementation
      localFavorites.get(user.user.id)?.delete(pickId);
      return [{ id: crypto.randomUUID(), user_id: user.user.id, pick_id: pickId }];
    }
    
    const { data, error } = await supabase
      .from('favorites')
      .delete()
      .match({
        user_id: user.user.id,
        pick_id: pickId
      })
      .select();
      
    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST204') { // Table doesn't exist or permission error
        console.warn('Favorites table not available, using local storage fallback');
        useLocalStorage = true;
        return await unsavePick(pickId);
      }
      console.error('Error unsaving pick from database:', error);
      throw error;
    }
    
    console.log('Successfully removed pick from database:', data);
    return data;
  } catch (error) {
    console.error('Error unsaving pick:', error);
    // Fallback to local storage
    console.warn('Falling back to local storage for favorites');
    useLocalStorage = true;
    return await unsavePick(pickId);
  }
};

/**
 * Check if a pick is in the user's favorites
 * @param pickId The ID of the pick to check
 * @returns Boolean indicating if the pick is favorited
 */
export const isPickSaved = async (pickId: string): Promise<boolean> => {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    return false;
  }
  
  try {
    if (useLocalStorage) {
      // Use local storage implementation
      return localFavorites.get(user.user.id)?.has(pickId) || false;
    }
    
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .match({
        user_id: user.user.id,
        pick_id: pickId
      })
      .maybeSingle();
      
    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST204') { // Table doesn't exist or permission error
        console.warn('Favorites table not available, using local storage fallback');
        useLocalStorage = true;
        return await isPickSaved(pickId);
      }
      
      console.error('Error checking if pick is saved in database:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Error checking if pick is saved:', error);
    // Fallback to local storage
    console.warn('Falling back to local storage for favorites check');
    useLocalStorage = true;
    return await isPickSaved(pickId);
  }
};

/**
 * Get all favorites for the current user
 * @returns Array of favorited picks with their details
 */
export const getUserFavorites = async (): Promise<PickType[]> => {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }
  
  try {
    if (useLocalStorage) {
      // Use local storage implementation
      // For local storage, we need to fetch all picks and filter them
      const userFavorites = localFavorites.get(user.user.id) || new Set();
      
      if (userFavorites.size === 0) {
        return [];
      }
      
      // Get all published picks
      const { data: allPicks, error: picksError } = await supabase
        .from('picks')
        .select(`
          *,
          profile:profiles (
            id,
            full_name,
            title,
            avatar_url,
            is_admin,
            is_creator,
            is_brand
          )
        `)
        .eq('status', 'published');
        
      if (picksError) {
        console.error('Error fetching picks for favorites:', picksError);
        return [];
      }
      
      // Filter to only include favorited picks
      return (allPicks || []).filter(pick => userFavorites.has(pick.id)) as PickType[];
    }
    
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        id,
        pick_id,
        picks:pick_id (
          *,
          profile:profiles (
            id,
            full_name,
            title,
            avatar_url,
            is_admin,
            is_creator,
            is_brand
          )
        )
      `)
      .eq('user_id', user.user.id);
      
    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST200') { // Table doesn't exist or relation not found
        useLocalStorage = true;
        return await getUserFavorites();
      }
      console.error('Error fetching user favorites:', error);
      throw error;
    }
    
    // Transform the data to match the expected format
    const picks: PickType[] = [];
    
    // Safely transform the data to ensure it matches our Pick type
    data.forEach(item => {
      if (item.picks && typeof item.picks === 'object') {
        picks.push(item.picks as unknown as PickType);
      }
    });
    
    return picks;
  } catch (error) {
    console.error('Error fetching user favorites:', error);
    // Fallback to local storage
    useLocalStorage = true;
    return await getUserFavorites();
  }
};
