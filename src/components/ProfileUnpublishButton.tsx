import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

type ProfileUnpublishButtonProps = {
  profile: Profile;
  onSuccess?: () => void;
};

export function ProfileUnpublishButton({ profile, onSuccess }: ProfileUnpublishButtonProps) {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isOwnProfile = user?.id === profile.id;
  const canUnpublish = isOwnProfile && profile.status === 'approved';

  const handleUnpublish = async () => {
    if (!canUnpublish) return;
    
    // Confirm with the user
    const confirmed = window.confirm(
      'Are you sure you want to unpublish your profile? Your picks will no longer be visible to others.'
    );
    
    if (!confirmed) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Update profile status to 'draft'
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          status: 'draft',
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);
        
      if (profileError) throw profileError;
      
      // Success
      if (onSuccess) onSuccess();
      
      alert('Your profile has been unpublished. Your picks are no longer visible to others.');
    } catch (error) {
      console.error('Error unpublishing profile:', error);
      setError('An error occurred while unpublishing your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOwnProfile) return null;
  
  return (
    <div className="w-full">
      {error && (
        <div className="text-red-500 text-sm mb-2">
          {error}
        </div>
      )}
      
      <button
        onClick={handleUnpublish}
        disabled={!canUnpublish || loading}
        className={`w-full py-2 px-4 rounded-md text-white font-medium ${
          canUnpublish && !loading
            ? 'bg-red-600 hover:bg-red-700'
            : 'bg-gray-400 cursor-not-allowed'
        }`}
      >
        {loading ? 'Unpublishing...' : 'Unpublish Profile'}
      </button>
    </div>
  );
}
