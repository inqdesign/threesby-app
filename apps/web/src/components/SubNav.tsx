import React, { useState, useEffect } from 'react';
import type { Profile, Pick } from '../types';

import { PreviewModal } from './PreviewModal';
import { ProfileEditModal } from './ProfileEditModal';
import { useAppStore } from '../store';
import { supabase } from '../lib/supabase';
import { useFollow } from '../hooks/useFollow';

type SubNavProps = {
  label?: string;
  profile?: Profile;
  picks?: Pick[];
  onSubmit?: () => void;
  onUnpublish?: () => Promise<void>;
  onCancelSubmission?: () => void;
  isOwnProfile?: boolean;
  onEditProfile?: () => void;
  onPublish?: () => Promise<void>;
  children?: React.ReactNode;
  className?: string;
  // Props passed from App.tsx
  user?: any;
  userProfile?: Profile | null;
  isAuthLoading?: boolean;
  loading?: boolean;
  isAdmin?: boolean;
  onLogin?: () => void;
};

export function SubNav({
  label = 'My Profile',
  profile,
  picks = [],
  onSubmit,
  onCancelSubmission,
  isOwnProfile = true, // Set default to true to ensure buttons show up
  onEditProfile,
  onPublish,
  children,
  className = '',
  // App.tsx props
  user,
  userProfile,
  isAuthLoading,
  loading,
}: SubNavProps) {
  const { fetchProfile } = useAppStore();
  const { getFollowCounts } = useFollow();
  const [refreshedPicks, setRefreshedPicks] = useState<Pick[]>([]);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  
  // Use userProfile if profile is not provided
  // Ensure effectiveProfile is never null when used with PublishButton
  const effectiveProfile = profile || (userProfile || undefined);
  const effectivePicks = picks.length > 0 ? picks : [];
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // For debugging
  console.log('SubNav received picks:', picks);

  // Fetch dynamic follow counts when effectiveProfile changes
  useEffect(() => {
    const fetchFollowCounts = async () => {
      if (effectiveProfile?.id) {
        const counts = await getFollowCounts(effectiveProfile.id);
        setFollowCounts(counts);
      }
    };
    
    fetchFollowCounts();
  }, [effectiveProfile?.id, getFollowCounts]);

  // Listen for follow changes to refresh counts
  useEffect(() => {
    const handleFollowChange = (event: CustomEvent) => {
      const { userId } = event.detail;
      // Refresh if this is the user whose stats we're showing
      if (userId === effectiveProfile?.id) {
        const fetchFollowCounts = async () => {
          if (effectiveProfile?.id) {
            const counts = await getFollowCounts(effectiveProfile.id);
            setFollowCounts(counts);
          }
        };
        fetchFollowCounts();
      }
    };

    window.addEventListener('followChanged', handleFollowChange as EventListener);
    
    return () => {
      window.removeEventListener('followChanged', handleFollowChange as EventListener);
    };
  }, [effectiveProfile?.id, getFollowCounts]);

  // Function to fetch the latest picks data
  const fetchLatestPicks = async () => {
    if (!effectiveProfile?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('picks')
        .select('*')
        .eq('profile_id', effectiveProfile.id);
      
      if (error) throw error;
      
      if (data) {
        console.log('Fetched latest picks:', data);
        setRefreshedPicks(data as Pick[]);
      }
    } catch (error) {
      console.error('Error fetching latest picks:', error);
    }
  };

  // For debugging
  console.log('SubNav props:', { 
    effectiveProfile, 
    status: effectiveProfile?.status, 
    isApproved: effectiveProfile?.status === 'approved',
    hasOnPublish: !!onPublish
  });

  // Use refreshed picks if available, otherwise fall back to props
  const picksToUse = refreshedPicks.length > 0 ? refreshedPicks : effectivePicks;
  const completePicks = picksToUse.filter((pick) => [1, 2, 3].includes(pick.rank));
  const hasNinePicks = completePicks.length === 9;

  // Check if profile is complete (e.g., has full_name, title, avatar_url)
  const isProfileComplete = effectiveProfile?.full_name && effectiveProfile?.title && effectiveProfile?.avatar_url;

  // Determine if changes were made after rejection
  const isRejectedWithChanges =
    effectiveProfile?.status === 'rejected' &&
    (effectiveProfile.last_submitted_at &&
      new Date(effectiveProfile.last_submitted_at) < new Date(effectivePicks[0]?.last_updated_at || effectiveProfile.updated_at));

  // Show loading state if any loading flags are true
  const isLoading = loading || isAuthLoading;

  // Determine message, CTA, and label based on state
  let message = label;
  let ctaLabel = 'Submit';
  let ctaAction = onSubmit;
  let ctaDisabled = true;
  let statusLabel = effectiveProfile?.status ? effectiveProfile.status.charAt(0).toUpperCase() + effectiveProfile.status.slice(1) : 'Draft';

  if (!hasNinePicks) {
    message = 'Share your best three Books, Places and Things!';
    ctaDisabled = true;
  } else if (hasNinePicks && !isProfileComplete) {
    message = 'Great! Complete your profile!';
    ctaDisabled = true;
  } else if (hasNinePicks && isProfileComplete && effectiveProfile?.status === 'draft') {
    message = 'Great! Submit your profile!';
    ctaDisabled = false;
  } else if (effectiveProfile?.status === 'pending') {
    message = 'Thank you for your Picks, we will publish your picks as soon as possible';
    ctaLabel = 'Cancel Submission';
    ctaAction = onCancelSubmission;
    ctaDisabled = false;
    statusLabel = 'In Review';
  } else if (effectiveProfile?.status === 'rejected') {
    message = `Please check ${effectiveProfile.rejection_note || 'your submission'}. and submit again.`;
    ctaDisabled = !isRejectedWithChanges;
    statusLabel = 'In Pending';
  } else if (effectiveProfile?.status === 'approved') {
    message = 'Your profile is published';
    ctaLabel = 'Submit';
    ctaAction = undefined; // No primary action button needed
    ctaDisabled = true;
    statusLabel = 'Active';
  } else if (effectiveProfile?.status === 'unpublished') {
    message = 'Your profile and picks are unpublished.';
    ctaLabel = 'Publish';
    ctaAction = onSubmit; // Reuses submit logic to republish
    ctaDisabled = !hasNinePicks || !isProfileComplete;
    statusLabel = 'Inactive Curator';
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      case 'draft':
      case 'unpublished':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Always show the buttons if we have a user or profile
  const shouldShowButtons = isOwnProfile || !!user || !!effectiveProfile;
  
  // No longer need the update button since drag and drop automatically publishes picks

  useEffect(() => {
    if (isEditModalOpen && effectiveProfile) {
      console.log('Effective profile:', effectiveProfile);
      console.log('Tags being passed to modal:', effectiveProfile.tags);
    }
  }, [isEditModalOpen, effectiveProfile]);

  return (
    <>
      <div
        className={`flex w-full items-center p-4 bg-card md:rounded-xl md:mt-6 ${className}`}
      >
        {/* Profile Image - Moved outside of button container */}
        {effectiveProfile?.avatar_url && shouldShowButtons && (
          <div 
            onClick={async () => {
              await fetchLatestPicks();
              setIsPreviewModalOpen(true);
            }}
                            className="w-12 h-12 rounded-full border border-border hover:bg-muted overflow-hidden flex items-center justify-center p-0 cursor-pointer mr-3"
            title="Preview Profile"
          >
            <img 
              src={effectiveProfile.avatar_url} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
          {/* Show active curator info */}
          {effectiveProfile?.status === 'approved' && (
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
              {/* Active curator symbol */}
              <div className="flex items-center">
                <span className="inline-flex items-center justify-center w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                <span className="text-sm font-medium">Active Curator</span>
              </div>
              
              {/* Username */}
              <div className="text-sm text-gray-500" data-component-name="SubNav">
                @{(effectiveProfile as any)?.username || `user_${effectiveProfile?.id?.substring(0, 8)}`}
              </div>
              
              {/* Followers count */}
              <div className="text-sm">
                <span className="font-medium">{followCounts.followers}</span> followers
              </div>
            </div>
          )}
          
          {/* Only show status label if not approved */}
          {effectiveProfile?.status && effectiveProfile.status !== 'approved' && (
            <span className={`text-sm font-medium px-2 py-1 rounded-full w-fit inline-flex items-center justify-center ${getStatusColor(effectiveProfile.status)}`}>
              {statusLabel}
            </span>
          )}
          {effectiveProfile?.status !== 'approved' && (
            <p className="font-body text-black text-xs md:text-base">{message}</p>
          )}
          {isLoading && <span className="text-sm text-gray-500 ml-2">Loading...</span>}
        </div>
        <div className="flex-1"></div>
        <div className="flex items-center gap-2 ml-auto">
          {children}
          {shouldShowButtons && (
            <>

              {/* Edit Profile Button */}
              {onEditProfile && (
                <button
                  onClick={async () => {
                    if (user?.id) {
                      await fetchProfile(user.id);
                    }
                    setIsEditModalOpen(true);
                  }}
                  className="px-2 py-1 md:px-4 md:py-2 rounded-[100px] border border-foreground text-foreground hover:bg-muted text-sm"
                  title="Edit Profile"
                >
                  Edit Profile
                </button>
              )}
              
              {/* Submit/Cancel Button - Not shown when profile is approved */}
              {ctaAction && effectiveProfile?.status !== 'approved' && (
                <button
                  onClick={ctaAction}
                  disabled={ctaDisabled}
                  className={`transition-colors ${
                    ctaDisabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed px-4 py-2 rounded-[100px]'
                      : ctaLabel === 'Cancel Submission'
                      ? 'px-4 py-2 rounded-[100px] bg-orange-600 text-white hover:bg-orange-700'
                      : 'px-4 py-2 rounded-[100px] bg-[#252525] text-white hover:bg-[#111111]'
                  }`}
                  title={ctaLabel}
                >
                  {ctaLabel}
                </button>
              )}
              
              {/* Update Button removed - Drag and drop now automatically publishes picks */}
            </>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {isPreviewModalOpen && effectiveProfile && (
        <PreviewModal 
          isOpen={isPreviewModalOpen} 
          onClose={() => setIsPreviewModalOpen(false)} 
          profile={effectiveProfile} 
          picks={refreshedPicks.length > 0 ? refreshedPicks : effectivePicks}
        />
      )}
      
      {isEditModalOpen && effectiveProfile && (
        <ProfileEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={async (data) => {
            try {
              if (!user) throw new Error('No user');
              
              console.log('Submitting profile update with data:', data);
              
              // Save bio to localStorage if available
              if (data.bio) {
                localStorage.setItem(`bio_${effectiveProfile.id}`, data.bio);
              }
              
              // Save location to localStorage if available
              const locationValue = (data as any).location;
              if (locationValue) {
                localStorage.setItem(`location_${effectiveProfile.id}`, locationValue);
              }
              
              // Save shelf image to localStorage if available
              if (data.shelf_image_url) {
                localStorage.setItem(`shelf_image_${effectiveProfile.id}`, data.shelf_image_url);
              }
              
              // Create a copy of the data object for database update
              // Only include fields that exist in the database schema
              const updateData: any = {
                id: effectiveProfile.id,
                updated_at: new Date().toISOString()
              };
              
              // Add fields that definitely exist in the database
              if (data.full_name !== undefined) updateData.full_name = data.full_name;
              if (data.title !== undefined) updateData.title = data.title;
              if (data.username !== undefined) updateData.username = data.username;
              if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;
              
              // Try to update standard profile fields first
              const { error: profileError } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', effectiveProfile.id);
                
              if (profileError) {
                console.error('Error updating basic profile:', profileError);
                throw profileError;
              }
              
              // Try to update additional fields (if they exist in the schema)
              const additionalData: any = {};
              if (data.shelf_image_url !== undefined) additionalData.shelf_image_url = data.shelf_image_url;
              if ((data as any).bio !== undefined) additionalData.message = (data as any).bio; // bio maps to message field
              if ((data as any).location !== undefined) additionalData.current_city = (data as any).location; // location maps to current_city field
              if ((data as any).tags !== undefined) additionalData.interests = (data as any).tags; // tags maps to interests field
              if (data.social_links !== undefined) additionalData.social_links = data.social_links;
              
              if (Object.keys(additionalData).length > 0) {
                const { error: additionalError } = await supabase
                  .from('profiles')
                  .update(additionalData)
                  .eq('id', effectiveProfile.id);
                  
                if (additionalError) {
                  console.warn('Error updating additional profile fields:', additionalError);
                  // Don't throw here - basic profile update succeeded
                }
              }
              
              console.log('Profile updated successfully');
              
              // Refresh profile data
              await fetchProfile(user?.id);
              
              // Close modal
              setIsEditModalOpen(false);
              
            } catch (error) {
              console.error('Error updating profile:', error);
              alert('Error saving profile. Please try again.');
            }
          }}
          initialData={{
            full_name: effectiveProfile.full_name || '',
            title: effectiveProfile.title || '',
            username: effectiveProfile.username || '',
            avatar_url: effectiveProfile.avatar_url || '',
            shelf_image_url: effectiveProfile.shelf_image_url || '',
            bio: effectiveProfile.message || '',
            location: effectiveProfile.current_city || '',
            tags: effectiveProfile.interests || [],
            social_links: effectiveProfile.social_links || {}
          }}
        />
      )}
    </>
  );
}
