import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { useFollow } from '../hooks/useFollow';

type FollowStatsProps = {
  userId: string;
};

export function FollowStats({ userId }: FollowStatsProps) {
  const { getFollowCounts } = useFollow();
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCounts();
  }, [userId]);

  const fetchCounts = async () => {
    const newCounts = await getFollowCounts(userId);
    setCounts(newCounts);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Users className="w-4 h-4" />
        <span>Loading stats...</span>
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