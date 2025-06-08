import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { ProfileSubmitButton } from './ProfileSubmitButton';
import { ProfileUnpublishButton } from './ProfileUnpublishButton';
import { Eye, Save } from 'lucide-react';
import type { Profile, Pick } from '../types';

type ProfileActionsProps = {
  profile: Profile;
  picks: Pick[];
  onRefresh?: () => void;
};

export function ProfileActions({ profile, picks, onRefresh }: ProfileActionsProps) {
  const { user } = useAuth();
  const isOwnProfile = user?.id === profile.id;

  // Count picks by category to check if we have enough for publishing
  const pickCounts = React.useMemo(() => {
    const counts = {
      books: 0,
      products: 0,
      places: 0
    };

    picks.forEach(pick => {
      if (pick.category in counts) {
        counts[pick.category as keyof typeof counts]++;
      }
    });

    return counts;
  }, [picks]);

  const hasRequiredPicks = React.useMemo(() => {
    return pickCounts.books >= 3 && 
           pickCounts.products >= 3 && 
           pickCounts.places >= 3;
  }, [pickCounts.books, pickCounts.products, pickCounts.places]);

  // Return null early if it's not the user's own profile
  if (!isOwnProfile) return null;
  
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-700">Profile Actions</h3>
      
      {/* Status indicator */}
      <div className="mb-4">
        <div className="text-sm text-gray-500 mb-1">Status</div>
        <div className="flex items-center">
          <div 
            className={`w-3 h-3 rounded-full mr-2 ${
              profile.status === 'approved' ? 'bg-green-500' : 
              profile.status === 'pending' ? 'bg-yellow-500' : 
              'bg-gray-400'
            }`}
          />
          <span className="text-sm font-medium">
            {profile.status === 'approved' ? 'Published' : 
             profile.status === 'pending' ? 'In Review' : 
             'Draft'}
          </span>
        </div>
      </div>
      
      {/* Requirements check */}
      {profile.status !== 'active' && (
        <div className="mb-4 p-3 bg-gray-100 rounded-md">
          <h4 className="text-sm font-medium mb-2">Publishing Requirements</h4>
          <ul className="text-sm space-y-1">
            <li className="flex items-center">
              <div className={`w-4 h-4 mr-2 flex items-center justify-center rounded-full ${profile.full_name ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
                {profile.full_name ? '✓' : ''}
              </div>
              <span>Profile name</span>
            </li>
            <li className="flex items-center">
              <div className={`w-4 h-4 mr-2 flex items-center justify-center rounded-full ${profile.title ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
                {profile.title ? '✓' : ''}
              </div>
              <span>Profile title</span>
            </li>
            <li className="flex items-center">
              <div className={`w-4 h-4 mr-2 flex items-center justify-center rounded-full ${pickCounts.books >= 3 ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
                {pickCounts.books >= 3 ? '✓' : ''}
              </div>
              <span>3 book picks ({pickCounts.books}/3)</span>
            </li>
            <li className="flex items-center">
              <div className={`w-4 h-4 mr-2 flex items-center justify-center rounded-full ${pickCounts.products >= 3 ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
                {pickCounts.products >= 3 ? '✓' : ''}
              </div>
              <span>3 product picks ({pickCounts.products}/3)</span>
            </li>
            <li className="flex items-center">
              <div className={`w-4 h-4 mr-2 flex items-center justify-center rounded-full ${pickCounts.places >= 3 ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
                {pickCounts.places >= 3 ? '✓' : ''}
              </div>
              <span>3 place picks ({pickCounts.places}/3)</span>
            </li>
          </ul>
        </div>
      )}
      
      {/* Action buttons */}
      <div className="space-y-3">
        {/* Submit button - only show if profile is not active or in review */}
        {profile.status !== 'active' && profile.status !== 'review' && (
          <ProfileSubmitButton 
            profile={profile} 
            picks={picks} 
            onSuccess={onRefresh} 
          />
        )}
        
        {/* Unpublish button - only show if profile is approved */}
        {profile.status === 'approved' && (
          <ProfileUnpublishButton 
            profile={profile} 
            onSuccess={onRefresh} 
          />
        )}
        
        {/* Update button - always show for own profile */}
        <button
          className="w-full py-2 px-4 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium flex items-center justify-center"
        >
          <Save className="w-4 h-4 mr-2" />
          Update
        </button>
        
        {/* Preview button - always show for own profile */}
        <button
          className="w-full py-2 px-4 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium flex items-center justify-center"
        >
          <Eye className="w-4 h-4 mr-2" />
          Preview
        </button>
      </div>
    </div>
  );
}
