import { useState, useEffect } from 'react';
import { UnifiedDetailModal } from './UnifiedDetailModal';
import { supabase } from '../lib/supabase';
import type { Pick } from '../types';

// Define Collection type locally (should match the one in UnifiedDetailModal)
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

type UnifiedDetailModalWrapperProps = {
  isOpen: boolean;
  onClose: () => void;
  // Either pick or collection ID
  pickId?: string;
  collectionId?: string;
  // Navigation context (array of IDs to navigate through)
  navigationIds?: string[];
  currentIndex?: number;
  mode: 'pick' | 'collection';
};

export function UnifiedDetailModalWrapper({
  isOpen,
  onClose,
  pickId,
  collectionId,
  navigationIds = [],
  currentIndex = 0,
  mode
}: UnifiedDetailModalWrapperProps) {
  const [pickData, setPickData] = useState<Pick | null>(null);
  const [collectionData, setCollectionData] = useState<Collection | null>(null);
  const [collectionPicks, setCollectionPicks] = useState<Pick[]>([]);
  const [curatorData, setCuratorData] = useState<{
    id: string;
    name: string;
    title: string;
    shelfImage?: string;
  } | null>(null);
  const [curatorCollections, setCuratorCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch pick data
  const fetchPickData = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('picks')
        .select(`
          *,
          profile:profiles(full_name, avatar_url)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setPickData(data);
    } catch (error) {
      console.error('Error fetching pick:', error);
      setPickData(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch collection data
  const fetchCollectionData = async (id: string) => {
    try {
      setLoading(true);
      
      // Fetch collection with curator profile
      const { data: collectionData, error: collectionError } = await supabase
        .from('collections')
        .select(`
          *,
          profiles:profile_id(full_name, title, shelf_image_url)
        `)
        .eq('id', id)
        .single();

      if (collectionError) throw collectionError;
      setCollectionData(collectionData);

      // Set curator data
      if (collectionData.profiles) {
        setCuratorData({
          id: collectionData.profile_id,
          name: collectionData.profiles.full_name || 'Unknown',
          title: collectionData.profiles.title || '',
          shelfImage: collectionData.profiles.shelf_image_url
        });

        // Fetch other collections by the same curator
        const { data: curatorCollections } = await supabase
          .from('collections')
          .select('*')
          .eq('profile_id', collectionData.profile_id)
          .order('created_at', { ascending: false });

        if (curatorCollections) {
          setCuratorCollections(curatorCollections);
        }
      }

      // Fetch picks in this collection
      if (collectionData.picks && collectionData.picks.length > 0) {
        const { data: picksData, error: picksError } = await supabase
          .from('picks')
          .select('*')
          .in('id', collectionData.picks);

        if (picksError) throw picksError;
        setCollectionPicks(picksData || []);
      }
    } catch (error) {
      console.error('Error fetching collection:', error);
      setCollectionData(null);
    } finally {
      setLoading(false);
    }
  };

  // Load data when modal opens or IDs change
  useEffect(() => {
    if (isOpen) {
      if (mode === 'pick' && pickId) {
        fetchPickData(pickId);
      } else if (mode === 'collection' && collectionId) {
        fetchCollectionData(collectionId);
      }
    }
  }, [isOpen, mode, pickId, collectionId]);

  // Navigation handlers
  const handleNavigateNext = () => {
    if (currentIndex < navigationIds.length - 1) {
      const nextId = navigationIds[currentIndex + 1];
      if (mode === 'pick') {
        fetchPickData(nextId);
      } else {
        fetchCollectionData(nextId);
      }
    }
  };

  const handleNavigatePrev = () => {
    if (currentIndex > 0) {
      const prevId = navigationIds[currentIndex - 1];
      if (mode === 'pick') {
        fetchPickData(prevId);
      } else {
        fetchCollectionData(prevId);
      }
    }
  };

  const handleNavigateToCollection = (collectionId: string) => {
    fetchCollectionData(collectionId);
  };

  const handleNavigateToPick = (pickId: string) => {
    fetchPickData(pickId);
  };

  if (loading) {
    return (
      <UnifiedDetailModal
        isOpen={isOpen}
        onClose={onClose}
        mode={mode}
        pickData={null}
        collectionData={null}
      />
    );
  }

  return (
    <UnifiedDetailModal
      isOpen={isOpen}
      onClose={onClose}
      mode={mode}
      pickData={pickData}
      collectionData={collectionData}
      collectionPicks={collectionPicks}
      curatorData={curatorData}
      curatorCollections={curatorCollections}
      onNavigateNext={handleNavigateNext}
      onNavigatePrev={handleNavigatePrev}
      onNavigateToCollection={handleNavigateToCollection}
      onNavigateToPick={handleNavigateToPick}
      hasNext={currentIndex < navigationIds.length - 1}
      hasPrev={currentIndex > 0}
      currentIndex={currentIndex}
      totalItems={navigationIds.length}
    />
  );
} 