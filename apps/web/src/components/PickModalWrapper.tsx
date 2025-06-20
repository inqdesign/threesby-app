import React, { useEffect, useState } from 'react';
import { useMatch } from 'react-router-dom';
import { PickDetailModal } from './PickDetailModal';
import { supabase } from '../lib/supabase';
import type { Pick } from '../types';

type PickModalWrapperProps = {
  children: React.ReactNode;
};

/**
 * PickModalWrapper - A component that wraps the application and provides
 * pick detail modal functionality using URL-based routing.
 * This allows direct linking to picks via URL.
 */
export function PickModalWrapper({ children }: PickModalWrapperProps) {
  // Use simple state management for the modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pickId, setPickId] = useState<string | null>(null);
  const [pickData, setPickData] = useState<Pick | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Only use the match for detecting pick routes
  const pickMatch = useMatch('/picks/:id');
  
  // Validate pickId format to prevent database errors
  const validatePickId = (id: string): boolean => {
    if (!id || id === 'new' || id.trim() === '') return false;
    
    // Check if the ID is a valid UUID
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      console.warn('Invalid pickId format:', id);
      return false;
    }
    
    return true;
  };
  
  // Function to fetch fresh pick data from the server
  const fetchFreshPickData = async (id: string) => {
    try {
      // Validate the pick ID first
      if (!validatePickId(id)) {
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

  // We no longer need mobile detection since we use the same approach for all devices

  // Setup a global event listener for opening the modal
  useEffect(() => {
    // Define the event handler to open the modal
    const handleOpenPickModal = async (event: CustomEvent) => {
      const id = event.detail?.pickId;
      if (id) {
        console.log('PickModalWrapper: Opening modal for pick ID:', id);
        
        // Use the modal approach for both desktop and mobile
        // Store the current scroll position
        localStorage.setItem('scrollPosition', window.scrollY.toString());
        localStorage.setItem('scrollTimestamp', Date.now().toString());
        
        setPickId(id);
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
    
    // Add event listener
    window.addEventListener('openPickModal' as any, handleOpenPickModal);
    
    // We'll no longer use URL-based routing for pick details
    // All pick details will be opened via the custom event only
    
    // Cleanup
    return () => {
      window.removeEventListener('openPickModal' as any, handleOpenPickModal);
    };
  }, [pickMatch]);

  // Handle closing the modal
  const handleCloseModal = () => {
    console.log('PickModalWrapper: Closing modal');
    
    // Simply close the modal without changing the URL
    // This ensures the original page remains visible in the background
    setIsModalOpen(false);
    setPickId(null);
    setPickData(null);
  };

  // Handle navigation between picks
  const handleNavigate = async (newPickId: string) => {
    console.log('PickModalWrapper: Navigating to new pick ID:', newPickId);
    
    // Use the modal approach for both desktop and mobile
    
    // Just update the state without changing the URL
    setPickId(newPickId);
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
      
      {/* Pick detail modal */}
      {pickId && (
        <PickDetailModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          pickId={pickId}
          pickData={pickData}
          isLoading={isLoading}
          onNavigate={handleNavigate}
        />
      )}
    </>
  );
}
