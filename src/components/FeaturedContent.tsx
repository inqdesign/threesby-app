import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile, Pick } from '../types';
import { FeaturedPickCard } from './FeaturedPickCard';
import { useNavigate } from 'react-router-dom';

interface FeaturedContentProps {
  type: 'threes' | 'curators';
  title: string;
  className?: string;
}

type FeaturedPick = Pick;

type FeaturedCurator = Profile & {
  picks: Pick[];
};

export function FeaturedContent({ type, className = '' }: FeaturedContentProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [featuredPicks, setFeaturedPicks] = useState<FeaturedPick[]>([]);
  const [featuredCurators, setFeaturedCurators] = useState<FeaturedCurator[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  // Fetch featured picks
  const fetchFeaturedPicks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('picks')
        .select(`
          *,
          profile: profiles(id, full_name, title, avatar_url, is_admin, is_creator, is_brand)
        `)
        .eq('is_featured', true)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setFeaturedPicks(data || []);
    } catch (err: any) {
      console.error('Error fetching featured picks:', err);
      setError('Failed to load featured picks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch featured curators
  const fetchFeaturedCurators = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          picks(*)
        `)
        .eq('is_featured', true)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setFeaturedCurators(data || []);
    } catch (err: any) {
      console.error('Error fetching featured curators:', err);
      setError('Failed to load featured curators. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle curator click to navigate to curators page
  const handleCuratorClick = (curator: FeaturedCurator) => {
    localStorage.setItem('scroll_to_curator', curator.id);
    navigate('/curators');
  };

  // Navigation is now handled by the pagination indicators and auto-advance

  // Navigation is now handled directly by pagination indicators

  // Fetch data on component mount
  useEffect(() => {
    if (type === 'threes') {
      fetchFeaturedPicks();
    } else {
      fetchFeaturedCurators();
    }
  }, [type]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-advance slides
  useEffect(() => {
    if (!loading && (featuredPicks.length > 0 || featuredCurators.length > 0)) {
      const totalCount = type === 'threes' ? featuredPicks.length : featuredCurators.length;
      if (totalCount <= 1) return; // Don't auto-advance if there's only one item
      
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % totalCount);
      }, 8000); // Auto-advance every 8 seconds
      
      return () => clearInterval(interval); // Clean up on unmount
    }
  }, [loading, featuredPicks.length, featuredCurators.length, type]);
  
  // Update pagination indicators
  useEffect(() => {
    // Find the appropriate container based on type
    const containerId = type === 'threes' ? 'threes-pagination' : 'curators-pagination';
    const paginationContainer = document.getElementById(containerId);
    
    if (paginationContainer && !loading) {
      // Clear any existing content
      paginationContainer.innerHTML = '';
      
      // Get the items to paginate
      const items = type === 'threes' ? featuredPicks : featuredCurators;
      
      // Create and append pagination indicators
      items.forEach((_, index) => {
        const indicator = document.createElement('button');
        indicator.className = `h-1.5 rounded-full transition-all ${currentIndex === index ? 'w-4 bg-[#ADFF8B]' : 'w-1.5 bg-gray-300'}`;
        indicator.setAttribute('aria-label', `Go to slide ${index + 1}`);
        indicator.onclick = () => setCurrentIndex(index);
        paginationContainer.appendChild(indicator);
      });
    }
  }, [currentIndex, loading, type, featuredPicks.length, featuredCurators.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // No pagination update functionality needed

  // Render loading skeleton
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="pick-card-container overflow-hidden">
          {/* Image skeleton */}
          <div className="w-full aspect-square bg-gray-200 animate-pulse" />
          {/* Info section skeleton */}
          <div className="py-4 px-3 space-y-2">
            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={`text-center py-6 ${className}`}>
        <p className="text-red-600 mb-4 text-sm">{error}</p>
        <button
          onClick={type === 'threes' ? fetchFeaturedPicks : fetchFeaturedCurators}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium py-1 px-3 rounded transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Render empty state
  if ((type === 'threes' && !featuredPicks.length) || (type === 'curators' && !featuredCurators.length)) {
    return (
      <div className={`text-center py-6 ${className}`}>
        <p className="text-gray-500 text-sm">No featured content found</p>
      </div>
    );
  }


  
  // Render content with smooth transitions
  return (
    <div className={`space-y-4 ${className}`}>

      
      <div className="relative overflow-hidden">
        {/* Content with smooth transitions */}
        <div className="transition-all duration-500 ease-in-out">
          {type === 'threes' ? (
            // Featured Picks
            featuredPicks.length > 0 && (
              <div className="animate-fadeIn">
                <FeaturedPickCard
                  pick={featuredPicks[currentIndex]}
                />
              </div>
            )
          ) : (
            // Featured Curators
            featuredCurators.length > 0 && (
              <div 
                className="cursor-pointer animate-fadeIn" 
                onClick={() => handleCuratorClick(featuredCurators[currentIndex])}
              >
                <div className="overflow-hidden pick-card-container">
                  {/* Use profile image as thumbnail */}
                  <div className="pick-image-container">
                    <img
                      src={featuredCurators[currentIndex].avatar_url || '/avatar-placeholder.png'}
                      alt={featuredCurators[currentIndex].full_name || 'Anonymous'}
                      className="w-full h-full object-cover aspect-square"
                    />
                  </div>
                  
                  {/* Bottom info part - similar to regular pick cards */}
                  <div className="py-4 pick-card-info">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-medium text-[#252525] truncate" style={{ fontSize: '1rem' }}>
                          {featuredCurators[currentIndex].full_name || 'Anonymous'}
                        </h3>
                        <div className="uppercase text-xs font-mono text-[#9d9b9b] line-clamp-1">
                          {featuredCurators[currentIndex].title || 'Curator'}
                        </div>
                      </div>
                      <button 
                        className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-medium rounded-full transition-colors border border-gray-200 text-gray-700 bg-white hover:bg-gray-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Follow functionality would go here
                          console.log('Follow curator', featuredCurators[currentIndex].id);
                        }}
                      >
                        <span>Follow</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}