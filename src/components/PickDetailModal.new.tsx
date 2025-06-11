import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Heart, ChevronLeft, ChevronRight, User, MessageCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PickImage } from './PickImage';
import { FollowButton } from './FollowButton';
import type { Pick } from '../types';
import DOMPurify from 'dompurify';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthModalStore } from '../store/authModalStore';

type PickDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  pickId: string | null;
  onNavigate?: (pickId: string) => void;
};

export function PickDetailModal({ isOpen, onClose, pickId, onNavigate }: PickDetailModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const openAuthModal = useAuthModalStore(state => state.openModal);
  const [pick, setPick] = useState<Pick | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [likes, setLikes] = useState<number>(0);
  const [relatedPicks, setRelatedPicks] = useState<Pick[]>([]);
  const [currentPickIndex, setCurrentPickIndex] = useState<number>(-1);
  const [loading, setLoading] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Fetch pick data
  useEffect(() => {
    if (!pickId || !isOpen) return;
    
    const fetchPick = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get pick details
        const { data, error } = await supabase
          .from('picks')
          .select(`
            *,
            profile:profiles(id, full_name, title, avatar_url, is_admin)
          `)
          .eq('id', pickId)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching pick:', error);
          setError(`Error: ${error.message || 'Failed to load pick'}`);
          setLoading(false);
          return;
        }
        
        if (!data) {
          console.error('Pick not found for ID:', pickId);
          setError('Pick not found');
          setLoading(false);
          return;
        }
        
        setPick(data);
        
        // Fetch related picks (top 3 from each category) for the same profile
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
                  profile:profiles(id, full_name, title, avatar_url, is_admin)
                `)
                .eq('profile_id', data.profile.id)
                .eq('category', category)
                .eq('status', 'published')
                .gt('rank', 0)
                .lte('rank', 3)
                .order('rank', { ascending: true });
              
              if (!categoryError && categoryData) {
                const topThree = categoryData.slice(0, 3);
                allRelatedPicks = [...allRelatedPicks, ...topThree];
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
            const index = allRelatedPicks.findIndex(p => p.id === pickId);
            setCurrentPickIndex(index);
          }
        } catch (relatedErr) {
          console.error('Error in related picks logic:', relatedErr);
          // Don't fail the whole component if related picks fail
          setRelatedPicks([]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching pick:', err);
        setError('Failed to load pick details');
        setLoading(false);
      }
    };
    
    fetchPick();
  }, [pickId, isOpen]);

  // Format description with DOMPurify
  const formatDescription = (description: string) => {
    return DOMPurify.sanitize(description);
  };

  // Handle like action
  const handleLike = async () => {
    if (!pick) return;
    
    if (!user) {
      openAuthModal('signup');
      return;
    }
    
    try {
      // Optimistic UI update
      setLikes(prev => prev + 1);
      
      // Update likes in the database
      const { error } = await supabase
        .from('picks')
        .update({ likes: likes + 1 })
        .eq('id', pick.id);
        
      if (error) {
        console.error('Error updating likes:', error);
        // Revert on error
        setLikes(prev => prev - 1);
      }
    } catch (error) {
      console.error('Error in like operation:', error);
      // Revert on error
      setLikes(prev => prev - 1);
    }
  };

  // Handle comment action
  const handleComment = () => {
    if (!pick) return;
    // In a real implementation, this would open a comment form
    alert('Comment functionality coming soon!');
  };

  // Navigate to previous pick
  const navigateToPreviousPick = () => {
    if (currentPickIndex <= 0 || !relatedPicks.length) return;
    
    const prevPick = relatedPicks[currentPickIndex - 1];
    setPick(prevPick);
    setCurrentPickIndex(currentPickIndex - 1);
    
    if (onNavigate) {
      onNavigate(prevPick.id);
    }
  };

  // Navigate to next pick
  const navigateToNextPick = () => {
    if (currentPickIndex >= relatedPicks.length - 1 || !relatedPicks.length) return;
    
    const nextPick = relatedPicks[currentPickIndex + 1];
    setPick(nextPick);
    setCurrentPickIndex(currentPickIndex + 1);
    
    if (onNavigate) {
      onNavigate(nextPick.id);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            {/* Modal panel slides in from right on desktop, bottom on mobile */}
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-300"
              enterFrom={isMobile ? "translate-y-full" : "translate-x-full"}
              enterTo={isMobile ? "translate-y-0" : "translate-x-0"}
              leave="transform transition ease-in-out duration-300"
              leaveFrom={isMobile ? "translate-y-0" : "translate-x-0"}
              leaveTo={isMobile ? "translate-y-full" : "translate-x-full"}
            >
              <Dialog.Panel 
                className={`pointer-events-auto fixed ${
                  isMobile 
                    ? 'inset-x-0 bottom-0 max-h-[90vh] rounded-t-xl' 
                    : 'inset-y-0 right-0 pl-10 max-w-[80vw] md:max-w-[60vw] lg:max-w-[50vw]'
                } flex`}
              >
                <div className="flex h-full w-full flex-col overflow-y-auto bg-white shadow-xl">
                  {/* Header with close button */}
                  <div className="sticky top-0 z-10 bg-white px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={onClose}
                          className="text-gray-600 hover:text-gray-900 transition-colors"
                          aria-label="Close"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-lg font-medium">
                          {pick?.category === 'books' ? 'Book' : 
                           pick?.category === 'places' ? 'Place' : 
                           pick?.category === 'products' ? 'Product' : 'Pick'} Details
                        </h2>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          disabled={currentPickIndex <= 0}
                          onClick={navigateToPreviousPick}
                          aria-label="Previous pick"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          disabled={currentPickIndex >= relatedPicks.length - 1}
                          onClick={navigateToNextPick}
                          aria-label="Next pick"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  {loading ? (
                    <div className="flex-1 flex items-center justify-center p-6">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#252525]"></div>
                    </div>
                  ) : error ? (
                    <div className="flex-1 flex items-center justify-center p-6">
                      <div className="text-center">
                        <p className="text-red-500 mb-4">{error}</p>
                        <button
                          onClick={onClose}
                          className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  ) : pick ? (
                    <div className="flex-1 overflow-y-auto">
                      <div className="p-6">
                        <div className="flex flex-col">
                          {/* Main image */}
                          <div className="w-full mb-6">
                            <div className="aspect-square overflow-hidden rounded-lg max-w-xl mx-auto">
                              <PickImage
                                key={pick.id} 
                                src={pick.image_url || ''}
                                alt={pick.title || ''}
                                className="w-full h-full"
                                aspectRatio="square"
                                variant="detail"
                              />
                            </div>
                          </div>
                          
                          {/* Details */}
                          <div className="w-full max-w-2xl mx-auto">
                            <h1 className="text-2xl font-normal text-[#585858] mb-2">
                              {pick.title}
                            </h1>
                            
                            {/* Reference below title */}
                            {pick.reference && (
                              <div className="text-sm text-gray-500 mb-4">
                                {pick.reference}
                              </div>
                            )}
                            
                            {/* Curator information with link to profile */}
                            <div className="flex items-center justify-between mb-6">
                              <Link 
                                to={`/profile/${pick.profile?.id}`} 
                                className="flex items-center gap-2.5"
                                onClick={() => {
                                  onClose();
                                  navigate(`/profile/${pick.profile?.id}`);
                                }}
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
                              {pick.profile && (
                                <div onClick={(e) => e.stopPropagation()}>
                                  <FollowButton userId={pick.profile.id} />
                                </div>
                              )}
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
                              <h2 className="text-lg font-light text-gray-500 mb-2">
                                About the {pick.category === 'books' ? 'book' : pick.category === 'places' ? 'place' : 'product'}
                              </h2>
                              <div
                                className="text-gray-700"
                                dangerouslySetInnerHTML={{
                                  __html: formatDescription(pick.description || ''),
                                }}
                              />
                            </div>
                            
                            {/* Discover more from this Curator section */}
                            {relatedPicks.length > 0 && (
                              <div className="mt-12">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">Discover more from this Curator</h2>
                                <div className="grid grid-cols-3 gap-2">
                                  {relatedPicks.map((relatedPick, index) => (
                                    <div
                                      key={relatedPick.id}
                                      className="cursor-pointer"
                                      onClick={() => {
                                        setPick(relatedPick);
                                        setCurrentPickIndex(index);
                                        if (onNavigate) {
                                          onNavigate(relatedPick.id);
                                        }
                                      }}
                                    >
                                      <div className="aspect-square relative rounded-lg overflow-hidden">
                                        <img
                                          src={relatedPick.image_url || ''}
                                          alt={relatedPick.title || ''}
                                          className={`w-full h-full object-cover ${
                                            relatedPick.id === pick.id ? 'ring-2 ring-black' : 'opacity-80 hover:opacity-100'
                                          }`}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
