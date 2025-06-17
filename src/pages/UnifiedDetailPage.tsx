import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { UnifiedDetailModal } from '../components/UnifiedDetailModal';
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

export function UnifiedDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine type from the current route path
  const type = location.pathname.includes('/pick') || location.pathname.includes('/picks') ? 'pick' : 'collection';
  
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
  const [curatorPicks, setCuratorPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Navigation context from location state
  const navigationIds = location.state?.navigationIds || [];
  const currentIndex = location.state?.currentIndex || 0;

  // Determine mode based on type parameter or data availability
  const mode = type || (pickData ? 'pick' : 'collection');

  // Prevent body scrolling when this page mounts
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Fetch pick data
  const fetchPickData = useCallback(async (pickId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('picks')
        .select(`
          *,
          profile:profiles(full_name, avatar_url)
        `)
        .eq('id', pickId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (!data) {
        setError('Pick not found');
        return;
      }

      setPickData(data);

      // If we have a pick, fetch other picks by the same curator
      if (data.profile_id) {
        // Set curator data from the pick profile
        if (data.profile) {
          setCuratorData({
            id: data.profile_id,
            name: data.profile.full_name || 'Unknown',
            title: data.profile.title || '',
            shelfImage: data.profile.shelf_image_url
          });
        }

        // Fetch other picks by the same curator
        const { data: curatorPicksData } = await supabase
          .from('picks')
          .select('*')
          .eq('profile_id', data.profile_id)
          .neq('id', data.id) // Exclude current pick
          .order('created_at', { ascending: false })
          .limit(10); // Limit to 10 most recent

        if (curatorPicksData) {
          setCuratorPicks(curatorPicksData);
        }

        // Also fetch collections by the same curator
        const { data: curatorCollectionsData } = await supabase
          .from('collections')
          .select('*')
          .eq('profile_id', data.profile_id)
          .order('created_at', { ascending: false })
          .limit(5); // Limit to 5 most recent

        if (curatorCollectionsData) {
          setCuratorCollections(curatorCollectionsData);
        }
      }
    } catch (error) {
      console.error('Error fetching pick:', error);
      setError('Failed to load pick details');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch collection data
  const fetchCollectionData = useCallback(async (collectionId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch collection with curator profile
      const { data: collectionData, error: collectionError } = await supabase
        .from('collections')
        .select(`
          *,
          profiles:profile_id(full_name, title, shelf_image_url)
        `)
        .eq('id', collectionId)
        .single();

      if (collectionError) {
        throw collectionError;
      }

      if (!collectionData) {
        setError('Collection not found');
        return;
      }

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
          .neq('id', collectionData.id) // Exclude current collection
          .order('created_at', { ascending: false })
          .limit(5); // Limit to 5 most recent

        if (curatorCollections) {
          setCuratorCollections(curatorCollections);
        }

        // Also fetch picks by the same curator
        const { data: curatorPicksData } = await supabase
          .from('picks')
          .select('*')
          .eq('profile_id', collectionData.profile_id)
          .order('created_at', { ascending: false })
          .limit(10); // Limit to 10 most recent

        if (curatorPicksData) {
          setCuratorPicks(curatorPicksData);
        }
      }

      // Fetch picks in this collection
      if (collectionData.picks && collectionData.picks.length > 0) {
        const { data: picksData, error: picksError } = await supabase
          .from('picks')
          .select('*')
          .in('id', collectionData.picks);

        if (picksError) {
          throw picksError;
        }
        
        setCollectionPicks(picksData || []);
      }
    } catch (error) {
      console.error('Error fetching collection:', error);
      setError('Failed to load collection details');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data when component mounts or ID changes
  useEffect(() => {
    if (!id) {
      setError('No ID provided');
      return;
    }

    if (type === 'pick' || (!type && mode === 'pick')) {
      fetchPickData(id);
    } else {
      fetchCollectionData(id);
    }
  }, [id, type, mode, fetchPickData, fetchCollectionData]);

  // Handle back navigation
  const handleBack = () => {
    // Check if we have a referrer or navigation context
    if (location.state?.from) {
      navigate(location.state.from, {
        state: {
          source: 'back_from_detail',
          timestamp: Date.now()
        }
      });
    } else {
      // Fallback to browser history
      window.history.back();
    }
  };

  // Handle navigation between items
  const handleNavigateNext = () => {
    if (currentIndex < navigationIds.length - 1) {
      const nextId = navigationIds[currentIndex + 1];
      const routePath = type === 'pick' ? `/pick/${nextId}` : `/collection/${nextId}`;
      navigate(routePath, {
        state: {
          ...location.state,
          currentIndex: currentIndex + 1
        },
        replace: true
      });
    }
  };

  const handleNavigatePrev = () => {
    if (currentIndex > 0) {
      const prevId = navigationIds[currentIndex - 1];
      const routePath = type === 'pick' ? `/pick/${prevId}` : `/collection/${prevId}`;
      navigate(routePath, {
        state: {
          ...location.state,
          currentIndex: currentIndex - 1
        },
        replace: true
      });
    }
  };



  // Close handler (navigate back)
  const handleClose = () => {
    handleBack();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">{error}</h1>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Back button for mobile */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-foreground hover:bg-background transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Use the existing UnifiedDetailModal component in "always open" mode */}
      <UnifiedDetailModal
        isOpen={true}
        onClose={handleClose}
        initialMode={mode as 'pick' | 'collection'}
        initialPickData={pickData}
        initialCollectionData={collectionData}
        initialCollectionPicks={collectionPicks}
        initialCuratorData={curatorData}
        initialCuratorCollections={curatorCollections}
        initialCuratorPicks={curatorPicks}
        onNavigateNext={handleNavigateNext}
        onNavigatePrev={handleNavigatePrev}
        hasNext={currentIndex < navigationIds.length - 1}
        hasPrev={currentIndex > 0}
        currentIndex={currentIndex}
        totalItems={navigationIds.length}
      />
    </div>
  );
} 