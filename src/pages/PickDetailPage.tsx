import { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, ChevronLeft, ChevronRight, User, MessageCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PickImage } from '../components/PickImage';
import type { Pick } from '../types';
import './PickDetailPage.css';
import DOMPurify from 'dompurify';

export const PickDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [pick, setPick] = useState<Pick | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [likes, setLikes] = useState<number>(0);
  const [relatedPicks, setRelatedPicks] = useState<Pick[]>([]);
  const [currentPickIndex, setCurrentPickIndex] = useState<number>(-1);

  // Fetch pick data
  useEffect(() => {
    console.log('PickDetailPage: useEffect triggered with id:', id);
    
    const fetchPick = async () => {
      if (!id) {
        console.error('PickDetailPage: No ID provided');
        return;
      }
      
      console.log('PickDetailPage: Fetching pick data for ID:', id);
      try {
        // Get pick details
        const { data, error } = await supabase
          .from('picks')
          .select(`
            *,
            profile:profiles(id, full_name, title, avatar_url)
          `)
          .eq('id', id)
          .maybeSingle();
        
        if (error) {
          console.error('Supabase error fetching pick:', error);
          setError(`Error: ${error.message || 'Failed to load pick'}`);
          return;
        }
        
        if (!data) {
          setError('Pick not found');
          return;
        }
        
        setPick(data);
        
        // Fetch exactly top 3 picks from each category (9 total) for the same profile
        try {
          if (data.profile && data.profile.id) {
            // Get all categories
            const categories = ['books', 'places', 'products'];
            let allRelatedPicks: Pick[] = [];
            
            // Fetch top 3 picks for each category
            for (const category of categories) {
              const { data: categoryData, error: categoryError } = await supabase
                .from('picks')
                .select(`
                  *,
                  profile:profiles(id, full_name, title, avatar_url)
                `)
                .eq('profile_id', data.profile.id)
                .eq('category', category)
                .eq('status', 'published') // Must be published
                .gt('rank', 0) // Rank must be greater than 0
                .lte('rank', 3) // Only get picks with rank 1, 2, or 3
                .order('rank', { ascending: true });
              
              if (!categoryError && categoryData) {
                // Take only the top 3 for each category
                const topThree = categoryData.slice(0, 3);
                allRelatedPicks = [...allRelatedPicks, ...topThree];
              } else if (categoryError) {
                console.error(`Error fetching ${category} picks:`, categoryError);
              }
            }
            
            // Sort all picks by category and rank
            allRelatedPicks.sort((a, b) => {
              // First sort by category
              if (a.category !== b.category) {
                return a.category.localeCompare(b.category);
              }
              // Then by rank
              return a.rank - b.rank;
            });
            
            // Ensure we have exactly 9 picks (3 per category)
            if (allRelatedPicks.length > 9) {
              allRelatedPicks = allRelatedPicks.slice(0, 9);
            }
            
            setRelatedPicks(allRelatedPicks);
            // Find index of current pick in related picks
            const index = allRelatedPicks.findIndex(p => p.id === id);
            setCurrentPickIndex(index);
          }
        } catch (relatedErr) {
          console.error('Error in related picks logic:', relatedErr);
          // Don't fail the whole component if related picks fail
          setRelatedPicks([]);
        }
      } catch (err) {
        console.error('Error fetching pick:', err);
        setError('Failed to load pick details');
      }
    };
    
    fetchPick();
  }, [id]);
  
  // Store the original referrer and source page when the component first mounts
  const [originalReferrer, setOriginalReferrer] = useState<string | null>(null);
  const [sourcePage, setSourcePage] = useState<string>('unknown');
  
  // Capture the original referrer and source page on first mount
  useEffect(() => {
    // Only set it once when the component first mounts
    if (!originalReferrer) {
      // If we have location state info, use that
      if (location.state?.from) {
        setOriginalReferrer(location.state.from);
        
        // Set source page for scroll position restoration
        if (location.state.from.includes('/curators')) {
          setSourcePage('curators');
        } else if (location.state.from.includes('/discover')) {
          setSourcePage('discover');
        } else {
          // Extract the page name from the path
          const pageName = location.state.from.split('/')[1] || 'unknown';
          setSourcePage(pageName);
        }
      } else if (document.referrer) {
        // Fallback to document.referrer
        setOriginalReferrer(document.referrer);
        
        // Try to extract source page from referrer
        if (document.referrer.includes('/curators')) {
          setSourcePage('curators');
        } else if (document.referrer.includes('/discover')) {
          setSourcePage('discover');
        }
      } else {
        // Default to discover if no referrer
        setOriginalReferrer('/discover');
        setSourcePage('discover');
      }
      
      console.log('Pick detail page - source detection:', {
        from: location.state?.from,
        sourcePage: sourcePage,
        referrer: document.referrer
      });
    }
  }, [originalReferrer, location.state]);
  
  // Handle back navigation with scroll position restoration
  const handleBack = () => {
    // Instead of just window.history.back(), we'll use navigate with state
    // This ensures the source page knows we're coming back from pick detail
    // and should restore scroll position
    
    // If we have an original referrer, navigate to it
    if (originalReferrer && originalReferrer.startsWith('/')) {
      navigate(originalReferrer, {
        state: {
          source: 'back_from_pick_detail',
          sourcePage: sourcePage,
          timestamp: Date.now() // Add timestamp to ensure state is always unique
        }
      });
    } else {
      // Fallback to browser history if we don't have a valid referrer
      window.history.back();
    }
  };
  
  // Handle like action
  const handleLike = async () => {
    if (!pick) return;
    
    try {
      // Optimistic UI update
      setLikes(likes + 1);
      
      // Update likes in the database
      const { error } = await supabase
        .from('picks')
        .update({ likes: likes + 1 })
        .eq('id', pick.id);
        
      if (error) {
        console.error('Error updating likes:', error);
        // Revert on error
        setLikes(likes);
      }
    } catch (error) {
      console.error('Error updating like status:', error);
      setLikes(likes); // Revert on error
    }
  };
  
  // Handle comment action
  const handleComment = async () => {
    if (!pick) return;
    
    try {
      // This would open a comment interface in a real implementation
      console.log('Comment feature not yet implemented');
      // For now, just show an alert
      alert('Comments feature coming soon!');
    } catch (error) {
      console.error('Error with comment action:', error);
    }
  };
  
  // Navigate to previous pick
  const navigateToPreviousPick = () => {
    if (currentPickIndex > 0 && relatedPicks.length > 0) {
      const previousPick = relatedPicks[currentPickIndex - 1];
      // Update current pick without full page reload
      setPick(previousPick);
      setCurrentPickIndex(currentPickIndex - 1);
      // Update URL without triggering a full navigation
      window.history.pushState({}, '', `/picks/${previousPick.id}`);
    }
  };
  
  // Navigate to next pick
  const navigateToNextPick = () => {
    if (currentPickIndex < relatedPicks.length - 1 && relatedPicks.length > 0) {
      const nextPick = relatedPicks[currentPickIndex + 1];
      // Update current pick without full page reload
      setPick(nextPick);
      setCurrentPickIndex(currentPickIndex + 1);
      // Update URL without triggering a full navigation
      window.history.pushState({}, '', `/picks/${nextPick.id}`);
    }
  };
  
  // Format description with line breaks
  const formatDescription = (text: string) => {
    if (!text) return '';
    
    // Replace newlines with <br> tags
    const formattedText = text.replace(/\n/g, '<br>');
    
    // Sanitize HTML to prevent XSS attacks
    return DOMPurify.sanitize(formattedText);
  };
  
  // No skeleton loading state - we'll show content as it loads
  
  // Prepare the content - either real data or skeleton
  const content = error ? (
    <div className="text-center py-12">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        {error}
      </h2>
    </div>
  ) : !pick ? (
    // Skeleton layout that exactly matches the real layout
    <>
      <div className="flex flex-col md:flex-row gap-12 rounded-lg">
        {/* Thumbnails for related picks - vertical on left side */}
        <div className="hidden md:block md:w-20">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="mb-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          ))}
        </div>
        
        {/* Main image */}
        <div className="w-full md:w-auto md:flex-1 flex-shrink-0">
          <div className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
          
          {/* Mobile thumbnails - horizontal below main image */}
          <div className="flex md:hidden overflow-x-auto space-x-2 mt-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
        
        {/* Details */}
        <div className="w-full md:w-1/2 md:pl-8 md:pr-8 max-w-prose">
          {/* Title */}
          <div className="h-8 bg-gray-200 rounded-md w-3/4 mb-2 animate-pulse"></div>
          
          {/* Reference */}
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4 animate-pulse"></div>
          
          {/* Curator information */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse"></div>
              <div>
                <div className="h-3 bg-gray-200 rounded w-20 mb-1 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>
            </div>
            <div className="h-8 w-20 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
          
          {/* Grey divider */}
          <div className="border-t border-gray-200 my-6"></div>
          
          {/* Action buttons */}
          <div className="flex items-center space-x-4 mb-8">
            <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          {/* Grey divider */}
          <div className="border-t border-gray-200 my-6"></div>
          
          {/* Content */}
          <div className="mb-8">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  ) : null; // Real content will be rendered in the return statement

  // If there's an error or we're still loading, show the appropriate state
  if (error || !pick) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-full" style={{ padding: '3rem' }}>
        {/* Back button for desktop - outside the main container */}
        <div className="hidden md:flex items-center mb-6">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2" size={20} />
            Back
          </button>
        </div>
        
        {/* Back button for mobile - inside the main container */}
        <div className="w-full md:hidden mb-4">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2" size={20} />
            Back
          </button>
        </div>
        
        {content}
      </div>
    );
  }
  
  // Show loading state
  if (!pick && !error) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-full" style={{ padding: '3rem' }}>
        <div className="flex flex-col items-center justify-center w-full py-12">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading pick details...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-full" style={{ padding: '3rem' }}>
        <div className="flex flex-col items-center justify-center w-full py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2" size={20} />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-full" style={{ padding: '3rem' }}>
      {/* Back button for desktop - outside the main container */}
      <div className="hidden md:flex items-center mb-6">
        <button
          onClick={handleBack}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2" size={20} />
          Back
        </button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-12 rounded-lg">
        {/* Back button for mobile - inside the main container */}
        <div className="w-full md:hidden mb-4">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2" size={20} />
            Back
          </button>
        </div>
        {/* Thumbnails for related picks - vertical on left side */}
        <div className="hidden md:block md:w-20">
          {relatedPicks.map((relatedPick, index) => (
            <div
              key={relatedPick.id}
              className="mb-4 cursor-pointer"
              onClick={() => {
                setPick(relatedPick);
                setCurrentPickIndex(index);
                // Update URL without triggering a full navigation
                window.history.pushState({}, '', `/picks/${relatedPick.id}`);
              }}
            >
              <div className="w-16 h-16 relative rounded-lg overflow-hidden">
                <img
                  src={relatedPick.image_url || ''}
                  alt={relatedPick.title || ''}
                  className={`w-full h-full object-cover ${
                    relatedPick.id === pick.id ? '' : 'opacity-70'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
        
        {/* Main image */}
        <div className="w-full md:w-auto md:flex-1 flex-shrink-0">
          <div className="aspect-square overflow-hidden rounded-lg">
            <PickImage
              key={pick.id} 
              src={pick.image_url || ''}
              alt={pick.title || ''}
              className="w-full h-full"
              aspectRatio="square"
              variant="detail"
            />
          </div>
          
          {/* Mobile thumbnails - horizontal below main image */}
          <div className="flex md:hidden overflow-x-auto space-x-2 mt-4">
            {relatedPicks.map((relatedPick, index) => (
              <div
                key={relatedPick.id}
                className="cursor-pointer"
                onClick={() => {
                  setPick(relatedPick);
                  setCurrentPickIndex(index);
                  window.history.pushState({}, '', `/picks/${relatedPick.id}`);
                }}
              >
                <div className="w-16 h-16 relative rounded-lg overflow-hidden">
                  <img
                    src={relatedPick.image_url || ''}
                    alt={relatedPick.title || ''}
                    className={`w-full h-full object-cover ${
                      relatedPick.id === pick.id ? '' : 'opacity-70'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Details */}
        <div className="w-full md:w-1/2 md:pl-8 md:pr-8 max-w-prose">
          {/* Category text removed */}
          
          <h1 className="text-2xl font-normal text-[#585858] mb-2">
            {pick.title}
          </h1>
          
          {/* Reference below title */}
          {pick.reference && (
            <div className="text-sm text-gray-500 mb-4">
              {pick.reference}
            </div>
          )}
          
          {/* Curator information with link to profile - using ProfileInfo style */}
          <div className="flex items-center justify-between mb-6">
            <Link 
              to={`/profile/${pick.profile?.id}`} 
              className="flex items-center gap-2.5"
            >
              <div className="relative" style={{ minWidth: '36px' }}>
                {pick.profile?.avatar_url ? (
                  <img
                    src={pick.profile.avatar_url}
                    alt={pick.profile?.full_name || 'Anonymous'}
                    className="rounded-full profile-avatar w-9 h-9"
                    loading="eager"
                    decoding="async"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                    <User size={16} className="text-gray-500" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-mono uppercase text-gray-500 mb-0.5">
                  {pick.profile?.title || 'Curator'}
                </p>
                <div className="flex items-center gap-1">
                  <h3 className="font-medium text-gray-900 text-sm">
                    {pick.profile?.full_name || 'Anonymous'}
                  </h3>
                  {pick.profile?.is_admin && (
                    <CheckCircle className="w-4 h-4 text-green-500" aria-label="Admin verified" />
                  )}
                </div>
              </div>
            </Link>
            <button className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-medium rounded-full transition-colors border border-gray-200 text-gray-700 bg-white hover:bg-gray-50">
              <span>Follow</span>
            </button>
          </div>
          
          {/* Grey divider */}
          <div className="border-t border-gray-200 my-6"></div>
          
          <div className="flex items-center space-x-4 mb-8">
            <button
              onClick={handleLike}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <Heart
                className="mr-1"
                size={20}
              />
              <span className="text-sm">{likes || '1.4K'}</span>
            </button>
            <button
              onClick={handleComment}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <MessageCircle size={20} className="mr-1" />
              <span className="text-sm">5</span>
            </button>
          </div>
          
          {/* Grey divider */}
          <div className="border-t border-gray-200 my-6"></div>
          
          <div className="mb-8">
            <h2 className="text-lg font-light text-gray-500 mb-2">About the {pick.category === 'books' ? 'book' : pick.category === 'places' ? 'place' : 'product'}</h2>
            <div
              className="text-gray-700"
              dangerouslySetInnerHTML={{
                __html: formatDescription(pick.description || ''),
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Navigation arrows for mobile */}
      <div className="flex justify-between mt-8 md:hidden">
        <button
          onClick={navigateToPreviousPick}
          className={`p-2 rounded-full bg-gray-100 ${
            currentPickIndex <= 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={currentPickIndex <= 0}
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={navigateToNextPick}
          className={`p-2 rounded-full bg-gray-100 ${
            currentPickIndex >= relatedPicks.length - 1
              ? 'opacity-50 cursor-not-allowed'
              : ''
          }`}
          disabled={currentPickIndex >= relatedPicks.length - 1}
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
};
