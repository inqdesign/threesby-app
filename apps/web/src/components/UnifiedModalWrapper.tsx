import React, { useEffect, useState } from 'react';
import { PickDetailModal } from './PickDetailModal';
import { UnifiedDetailModal } from './UnifiedDetailModal';
import { supabase } from '../lib/supabase';
import type { Pick } from '../types';

// Define Collection type locally
type Collection = {
  id: string;
  profile_id: string;
  title: string;
  description: string;
  categories: string[];
  picks: string[];
  cover_image?: string;
  font_color?: 'dark' | 'light';
  created_at: string;
  updated_at: string;
  profiles?: any;
};

type UnifiedModalWrapperProps = {
  children: React.ReactNode;
};

/**
 * UnifiedModalWrapper - A component that wraps the application and provides
 * smooth modal functionality for both picks and collections using cached data.
 * This allows direct linking to content via URL without page refreshing.
 */
export function UnifiedModalWrapper({ children }: UnifiedModalWrapperProps) {
  // Use simple state management for the modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'pick' | 'collection'>('pick');
  const [pickId, setPickId] = useState<string | null>(null);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [pickData, setPickData] = useState<Pick | null>(null);
  const [collectionData, setCollectionData] = useState<Collection | null>(null);
  const [collectionPicks, setCollectionPicks] = useState<Pick[]>([]);
  const [curatorData, setCuratorData] = useState<any>(null);
  const [curatorCollections, setCuratorCollections] = useState<Collection[]>([]);
  const [curatorPicks, setCuratorPicks] = useState<Pick[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // No longer using URL-based routing - using smooth cached modal system for both picks and collections
  
  // Validate ID format to prevent database errors
  const validateId = (id: string): boolean => {
    if (!id || id === 'new' || id.trim() === '') return false;
    
    // Check if the ID is a valid UUID
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      console.warn('Invalid ID format:', id);
      return false;
    }
    
    return true;
  };
  
  // Function to fetch fresh pick data from the server
  const fetchFreshPickData = async (id: string) => {
    try {
      // Validate the pick ID first
      if (!validateId(id)) {
        setIsLoading(false);
        return null;
      }
      
      // Get pick details
      const { data, error } = await supabase
        .from('picks')
        .select(`
          *,
          profile:profiles(id, full_name, title, avatar_url, is_admin)
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching pick:', error);
        return null;
      }
      
      if (!data) {
        console.error('Pick not found for ID:', id);
        return null;
      }
      
      // Cache the pick data in session storage with timestamp
      window.sessionStorage.setItem(`pick_${id}`, JSON.stringify(data));
      window.sessionStorage.setItem(`pick_${id}_timestamp`, Date.now().toString());
      
      // Only update state if this is still the current pick
      if (pickId === id) {
        setPickData(data);
        setIsLoading(false);
      }
      
      return data;
    } catch (err) {
      console.error('Error fetching fresh pick data:', err);
      if (pickId === id) {
        setIsLoading(false);
      }
      return null;
    }
  };

  // Function to fetch fresh collection data from the server
  const fetchFreshCollectionData = async (id: string) => {
    console.log('🔥 fetchFreshCollectionData CALLED with ID:', id);
    console.log('🔥 Function is definitely being called!');
    try {
      // Validate the collection ID first
      if (!validateId(id)) {
        console.log('❌ Invalid ID, returning null');
        setIsLoading(false);
        return null;
      }
      console.log('✅ ID validation passed');
      
      // Get collection details
      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          profile:profiles(id, full_name, title, avatar_url, shelf_image_url, is_admin)
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching collection:', error);
        return null;
      }
      
      if (!data) {
        console.error('Collection not found for ID:', id);
        return null;
      }
      
      console.log('Raw collection data from Supabase:', data);
      
      // Cache the collection data in session storage with timestamp
      window.sessionStorage.setItem(`collection_${id}`, JSON.stringify(data));
      window.sessionStorage.setItem(`collection_${id}_timestamp`, Date.now().toString());
      
      // Update state with the fetched collection data
      console.log('✅ Updating state with collection data');
      console.log('Full collection data received:', data);
      console.log('Collection profile_id:', data.profile_id);
      console.log('Collection profile object:', data.profile);
      console.log('Collection picks array:', data.picks);
      
        setCollectionData(data);
        
      // Set curator data from the collection's profile (handle case where profile is null)
        if (data.profile) {
        console.log('Setting curator from profile data:', data.profile);
          setCuratorData({
            id: data.profile_id,
            name: data.profile.full_name || 'Unknown',
            title: data.profile.title || '',
            shelfImage: data.profile.shelf_image_url
          });
      } else if (data.profile_id) {
        console.log('Profile join failed, setting Anonymous curator for profile_id:', data.profile_id);
        // If profile join failed but we have profile_id, try to fetch it separately
        setCuratorData({
          id: data.profile_id,
          name: 'Anonymous',
          title: '',
          shelfImage: undefined
        });
      } else {
        console.log('No profile_id found in collection data');
        }
        
      // Always fetch collection picks if they exist (regardless of curator)
        if (data.picks && data.picks.length > 0) {
        console.log('Fetching collection picks:', data.picks);
          const { data: picksData, error: picksError } = await supabase
            .from('picks')
            .select('*')
            .in('id', data.picks);
          
        if (picksError) {
          console.error('Error fetching collection picks:', picksError);
        } else {
          console.log('Fetched collection picks:', picksData);
          setCollectionPicks(picksData || []);
        }
      } else {
        console.log('No picks in collection picks array:', data.picks);
        setCollectionPicks([]);
      }
      
      // Fetch curator collections (all collections by the same curator)
      if (data.profile_id) {
        console.log('Fetching curator collections for profile_id:', data.profile_id);
        const { data: curatorCollectionsData } = await supabase
          .from('collections')
          .select('*')
          .eq('profile_id', data.profile_id)
          .order('created_at', { ascending: false });
        
        console.log('Curator collections fetched:', curatorCollectionsData);
        if (curatorCollectionsData) {
          setCuratorCollections(curatorCollectionsData);
          console.log('Set curator collections state');
        }
        
        // Fetch curator picks
        console.log('Fetching curator picks for profile_id:', data.profile_id);
        const { data: curatorPicksData } = await supabase
          .from('picks')
          .select('*')
          .eq('profile_id', data.profile_id)
          .order('created_at', { ascending: false })
          .limit(10);
        
        console.log('Curator picks fetched:', curatorPicksData);
        if (curatorPicksData) {
          setCuratorPicks(curatorPicksData);
          console.log('Set curator picks state');
          }
      } else {
        console.log('No profile_id found, skipping curator data fetch');
        }
        
        setIsLoading(false);
      
      return data;
    } catch (err) {
      console.error('Error fetching fresh collection data:', err);
        setIsLoading(false);
      return null;
    }
  };

  // We no longer need mobile detection since we use the same approach for all devices

  // Setup global event listeners for opening both pick and collection modals
  useEffect(() => {
    // Define the event handler to open pick modal
    const handleOpenPickModal = async (event: CustomEvent) => {
      const id = event.detail?.pickId;
      if (id) {
        console.log('UnifiedModalWrapper: Opening modal for pick ID:', id);
        
        // Use the modal approach for both desktop and mobile
        // Store the current scroll position
        localStorage.setItem('scrollPosition', window.scrollY.toString());
        localStorage.setItem('scrollTimestamp', Date.now().toString());
        
        setModalMode('pick');
        setPickId(id);
        setCollectionId(null);
        setCollectionData(null);
        setCollectionPicks([]);
        setCuratorData(null);
        setCuratorCollections([]);
        setCuratorPicks([]);
        setIsLoading(true);
        
        // Try to get from cache first
        const cachedPick = window.sessionStorage.getItem(`pick_${id}`);
        if (cachedPick) {
          try {
            const parsedPick = JSON.parse(cachedPick);
            // Check if cache is still valid (less than 5 minutes old)
            const cacheTimestamp = window.sessionStorage.getItem(`pick_${id}_timestamp`);
            const now = Date.now();
            if (cacheTimestamp && (now - parseInt(cacheTimestamp)) < 5 * 60 * 1000) {
              // Set the data before opening the modal
              setPickData(parsedPick);
              setIsLoading(false);
              setIsModalOpen(true);
              // Refresh data in background
              setTimeout(() => fetchFreshPickData(id), 100);
              return;
            }
          } catch (e) {
            console.warn('Error parsing cached pick data:', e);
            // Continue with fresh fetch if cache parsing fails
          }
        }
        
        // No valid cache, fetch fresh data and wait for it to complete
        const freshData = await fetchFreshPickData(id);
        if (freshData) {
          setPickData(freshData);
          setIsLoading(false);
          setIsModalOpen(true);
        } else {
          // Handle error case
          console.error('Failed to fetch pick data');
          setIsLoading(false);
        }
      }
    };

    // Define the event handler to open collection modal
    const handleOpenCollectionModal = async (event: CustomEvent) => {
      const id = event.detail?.collectionId;
      console.log('🔥🔥🔥 COLLECTION MODAL HANDLER CALLED 🔥🔥🔥');
      console.log('handleOpenCollectionModal called with ID:', id);
      if (id) {
        console.log('UnifiedModalWrapper: Opening modal for collection ID:', id);
        
        // Use the modal approach for both desktop and mobile
        // Store the current scroll position
        localStorage.setItem('scrollPosition', window.scrollY.toString());
        localStorage.setItem('scrollTimestamp', Date.now().toString());
        
        console.log('Setting modal state...');
        setModalMode('collection');
        setCollectionId(id);
        setPickId(null);
        setPickData(null);
        // Don't clear the related data here - let fetchFreshCollectionData set it
        setIsLoading(true);
        console.log('Modal state set, about to check cache...');
        
        // Skip cache for now to ensure we get fresh data with proper profile joins
        // TODO: Re-enable cache once profile joining is working correctly
        console.log('Skipping cache, fetching fresh collection data...');
        
        // No valid cache, fetch fresh data and wait for it to complete
        console.log('About to fetch fresh collection data for ID:', id);
        console.log('🚀 CALLING fetchFreshCollectionData NOW!');
        const freshData = await fetchFreshCollectionData(id);
        console.log('🚀 fetchFreshCollectionData RETURNED:', freshData);
        console.log('Fresh data fetch completed, result:', freshData);
        if (freshData) {
          console.log('Setting collection data and opening modal');
          // Don't set collection data here since fetchFreshCollectionData already did it
          setIsLoading(false);
          
          // Debug logging for what we're about to pass to modal
          console.log('🎯 ABOUT TO OPEN MODAL WITH DATA:');
          console.log('modalMode:', modalMode);
          console.log('collectionData state:', collectionData);
          console.log('collectionPicks state:', collectionPicks);
          console.log('curatorData state:', curatorData);
          console.log('curatorCollections state:', curatorCollections);
          console.log('curatorPicks state:', curatorPicks);
          
          setIsModalOpen(true);
        } else {
          // Handle error case
          console.error('Failed to fetch collection data - freshData is null/undefined');
          setIsLoading(false);
        }
      }
    };
    
    // Add event listeners
    console.log('🎯 ATTACHING EVENT LISTENERS');
    window.addEventListener('openPickModal' as any, handleOpenPickModal);
    window.addEventListener('openCollectionModal' as any, handleOpenCollectionModal);
    console.log('🎯 EVENT LISTENERS ATTACHED');
    
    // All detail modals will be opened via custom events only - no URL-based routing
    
    // Cleanup
    return () => {
      window.removeEventListener('openPickModal' as any, handleOpenPickModal);
      window.removeEventListener('openCollectionModal' as any, handleOpenCollectionModal);
    };
  }, []);

  // Handle closing the modal
  const handleCloseModal = () => {
    console.log('UnifiedModalWrapper: Closing modal');
    
    // Simply close the modal without changing the URL
    // This ensures the original page remains visible in the background
    setIsModalOpen(false);
    setPickId(null);
    setCollectionId(null);
    setPickData(null);
    setCollectionData(null);
    setCollectionPicks([]);
    setCuratorData(null);
    setCuratorCollections([]);
    setCuratorPicks([]);
    setModalMode('pick');
  };

  // Handle navigation between picks (keeping for compatibility but unused in unified version)
  const handleNavigate = async (newPickId: string) => {
    console.log('UnifiedModalWrapper: Navigating to new pick ID:', newPickId);
    
    // Use the modal approach for both desktop and mobile
    
    // Just update the state without changing the URL
    setModalMode('pick');
    setPickId(newPickId);
    setCollectionId(null);
    setCollectionData(null);
    setCollectionPicks([]);
    setCuratorData(null);
    setCuratorCollections([]);
    setCuratorPicks([]);
    setIsLoading(true);
    
    // Try to get from cache first
    const cachedPick = window.sessionStorage.getItem(`pick_${newPickId}`);
    if (cachedPick) {
      try {
        const parsedPick = JSON.parse(cachedPick);
        // Check if cache is still valid (less than 5 minutes old)
        const cacheTimestamp = window.sessionStorage.getItem(`pick_${newPickId}_timestamp`);
        const now = Date.now();
        if (cacheTimestamp && (now - parseInt(cacheTimestamp)) < 5 * 60 * 1000) {
          // Set the data before ensuring modal is open
          setPickData(parsedPick);
          setIsLoading(false);
          // Ensure modal is open
          setIsModalOpen(true);
          // Refresh data in background
          setTimeout(() => fetchFreshPickData(newPickId), 100);
          return;
        }
      } catch (e) {
        console.warn('Error parsing cached pick data:', e);
        // Continue with fresh fetch if cache parsing fails
      }
    }
    
    // No valid cache, fetch fresh data and wait for it to complete
    const freshData = await fetchFreshPickData(newPickId);
    if (freshData) {
      setPickData(freshData);
      setIsLoading(false);
      // Ensure modal is open
      setIsModalOpen(true);
    } else {
      // Handle error case
      console.error('Failed to fetch pick data');
      setIsLoading(false);
    }
  };

  return (
    <>
      {children}
      
      {/* Unified detail modal for both picks and collections */}
      {isModalOpen && (
        <UnifiedDetailModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          initialMode={modalMode}
          initialPickData={modalMode === 'pick' ? pickData : null}
          initialCollectionData={modalMode === 'collection' ? collectionData : null}
          initialCollectionPicks={collectionPicks}
          initialCuratorData={curatorData}
          initialCuratorCollections={curatorCollections}
          initialCuratorPicks={curatorPicks}
          onNavigateNext={undefined}
          onNavigatePrev={undefined}
          hasNext={false}
          hasPrev={false}
          currentIndex={0}
          totalItems={1}
        />
      )}
    </>
  );
}
