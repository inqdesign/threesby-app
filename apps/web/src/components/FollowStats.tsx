import React, { useState, useEffect, useCallback } from 'react';
import { Users } from 'lucide-react';
import { useFollow } from '../hooks/useFollow';

interface FollowStatsProps {
  userId: string;
}

export function FollowStats({ userId }: FollowStatsProps) {
  const { getFollowCounts } = useFollow();
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);

  const fetchCounts = useCallback(async () => {
    setLoading(true);
    
    try {
      const newCounts = await getFollowCounts(userId);
      
      if (typeof newCounts === 'object' && newCounts !== null) {
        setCounts(newCounts);
      } else {
        setCounts({ followers: 0, following: 0 });
      }
    } catch (error) {
      console.error('Error fetching follow counts:', error);
      setCounts({ followers: 0, following: 0 });
    } finally {
      setLoading(false);
    }
  }, [userId, getFollowCounts]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // Listen for follow changes to refresh counts
  useEffect(() => {
    const handleFollowChange = (event: CustomEvent) => {
      const { userId: changedUserId } = event.detail;
      // Refresh if this is the user whose stats we're showing
      if (changedUserId === userId) {
        fetchCounts();
      }
    };

    window.addEventListener('followChanged', handleFollowChange as EventListener);
    
    return () => {
      window.removeEventListener('followChanged', handleFollowChange as EventListener);
    };
  }, [userId, fetchCounts]);

  if (loading) {
    return (
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <Users className="w-4 h-4" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-2">
        <span className="font-medium">{counts.followers}</span>
        <span className="text-gray-500">Followers</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-medium">{counts.following}</span>
        <span className="text-gray-500">Following</span>
      </div>
    </div>
  );
}