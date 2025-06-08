import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import type { Profile, Pick } from '../types';

type ProfileSubmitButtonProps = {
  profile: Profile;
  picks: Pick[];
  onSuccess?: () => void;
};

export function ProfileSubmitButton({ profile, picks, onSuccess }: ProfileSubmitButtonProps) {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Count picks by category
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

  const hasRequiredPicks = 
    pickCounts.books >= 3 && 
    pickCounts.products >= 3 && 
    pickCounts.places >= 3;

  const isOwnProfile = user?.id === profile.id;
  const canSubmit = isOwnProfile && hasRequiredPicks && profile.status !== 'review' && profile.status !== 'active';

  const handleSubmit = async () => {
    if (!canSubmit) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Check if profile has all required fields
      if (!profile.full_name || !profile.title) {
        setError('Please complete your profile information before submitting.');
        return;
      }
      
      // Create a submission review entry
      const { error: submissionError } = await supabase
        .from('submission_reviews')
        .insert({
          profile_id: profile.id,
          status: 'pending',
          created_at: new Date().toISOString()
        });
        
      if (submissionError) throw submissionError;
      
      // Update profile status to 'review'
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          status: 'review',
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);
        
      if (profileError) throw profileError;
      
      // Success
      if (onSuccess) onSuccess();
      
      alert('Your profile has been submitted for review. You will be notified once it is approved.');
    } catch (error) {
      console.error('Error submitting profile:', error);
      setError('An error occurred while submitting your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOwnProfile) return null;
  
  return (
    <div className="w-full">
      {!hasRequiredPicks && (
        <div className="text-red-500 text-sm mb-2">
          You need at least 3 picks in each category (books, products, places) before submitting.
        </div>
      )}
      
      {error && (
        <div className="text-red-500 text-sm mb-2">
          {error}
        </div>
      )}
      
      <button
        onClick={handleSubmit}
        disabled={!canSubmit || loading}
        className={`w-full py-2 px-4 rounded-md text-white font-medium ${
          canSubmit && !loading
            ? 'bg-black hover:bg-gray-800'
            : 'bg-gray-400 cursor-not-allowed'
        }`}
      >
        {loading ? 'Submitting...' : 'Submit Profile for Review'}
      </button>
    </div>
  );
}
