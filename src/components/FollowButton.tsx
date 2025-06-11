import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useFollow } from '../hooks/useFollow';
import { useAuth } from '../hooks/useAuth';
import { AuthModal } from './AuthModal';

type FollowButtonProps = {
  userId: string;
  onFollowChange?: (isFollowing: boolean) => void;
};

export function FollowButton({ userId, onFollowChange }: FollowButtonProps) {
  const { user } = useAuth();
  const { followUser, unfollowUser, isFollowing: checkIsFollowing } = useFollow();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (user && userId && user.id !== userId) {
      checkFollowStatus();
    } else {
      setLoading(false);
    }
  }, [user, userId]);

  const checkFollowStatus = async () => {
    try {
      const following = await checkIsFollowing(userId);
      setIsFollowing(following);
    } catch (error) {
      console.error('Error checking follow status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setLoading(true);
    try {
      const success = isFollowing
        ? await unfollowUser(userId)
        : await followUser(userId);

      if (success) {
        setIsFollowing(!isFollowing);
        onFollowChange?.(!isFollowing);
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't show button for current user
  if (user?.id === userId) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleAction}
        disabled={loading}
        className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-medium rounded-full transition-colors border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        aria-label={isFollowing ? 'Unfollow' : 'Follow'}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        <span>{isFollowing ? 'Following' : 'Follow'}</span>
      </button>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode="login"
      />
    </>
  );
}