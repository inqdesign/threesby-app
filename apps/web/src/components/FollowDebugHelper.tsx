import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface FollowDebugHelperProps {
  userId: string;
  showDetails?: boolean;
}

interface DebugInfo {
  userId: string;
  followsTableExists: boolean;
  followersCount: number;
  followingCount: number;
  rawFollowersData: any[];
  rawFollowingData: any[];
  rpcFollowersCount: number | null;
  rpcFollowingCount: number | null;
  errors: string[];
}

export function FollowDebugHelper({ userId, showDetails = false }: FollowDebugHelperProps) {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchDebugInfo();
    }
  }, [userId]);

  const fetchDebugInfo = async () => {
    const errors: string[] = [];
    setLoading(true);

    try {
      // Test 1: Check if follows table exists and is accessible
      let followsTableExists = false;
      let rawFollowersData: any[] = [];
      let rawFollowingData: any[] = [];
      let followersCount = 0;
      let followingCount = 0;

      try {
        const followersResponse = await supabase
          .from('follows')
          .select('*')
          .eq('following_id', userId);

        const followingResponse = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', userId);

        if (followersResponse.error) {
          errors.push(`Followers query error: ${followersResponse.error.message}`);
        } else {
          followsTableExists = true;
          rawFollowersData = followersResponse.data || [];
          followersCount = rawFollowersData.length;
        }

        if (followingResponse.error) {
          errors.push(`Following query error: ${followingResponse.error.message}`);
        } else {
          rawFollowingData = followingResponse.data || [];
          followingCount = rawFollowingData.length;
        }
      } catch (error) {
        errors.push(`Table access error: ${error}`);
      }

      // Test 2: Try RPC functions
      let rpcFollowersCount: number | null = null;
      let rpcFollowingCount: number | null = null;

      try {
        const { data: rpcFollowers, error: rpcFollowersError } = await supabase
          .rpc('get_follower_count', { profile_id: userId });
        
        if (rpcFollowersError) {
          errors.push(`RPC get_follower_count error: ${rpcFollowersError.message}`);
        } else {
          rpcFollowersCount = rpcFollowers;
        }
      } catch (error) {
        errors.push(`RPC follower count error: ${error}`);
      }

      try {
        const { data: rpcFollowing, error: rpcFollowingError } = await supabase
          .rpc('get_following_count', { profile_id: userId });
        
        if (rpcFollowingError) {
          errors.push(`RPC get_following_count error: ${rpcFollowingError.message}`);
        } else {
          rpcFollowingCount = rpcFollowing;
        }
      } catch (error) {
        errors.push(`RPC following count error: ${error}`);
      }

      setDebugInfo({
        userId,
        followsTableExists,
        followersCount,
        followingCount,
        rawFollowersData,
        rawFollowingData,
        rpcFollowersCount,
        rpcFollowingCount,
        errors
      });
    } catch (error) {
      errors.push(`General error: ${error}`);
      setDebugInfo({
        userId,
        followsTableExists: false,
        followersCount: 0,
        followingCount: 0,
        rawFollowersData: [],
        rawFollowingData: [],
        rpcFollowersCount: null,
        rpcFollowingCount: null,
        errors
      });
    } finally {
      setLoading(false);
    }
  };

  const createTestFollow = async () => {
    if (!user || user.id === userId) return;

    try {
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: userId
        });

      if (error) {
        alert(`Error creating test follow: ${error.message}`);
      } else {
        alert('Test follow created successfully!');
        fetchDebugInfo(); // Refresh data
      }
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  if (!showDetails) return null;

  if (loading) {
    return <div className="p-4 bg-yellow-100 rounded">Loading debug info...</div>;
  }

  if (!debugInfo) {
    return <div className="p-4 bg-red-100 rounded">Failed to load debug info</div>;
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg text-xs space-y-2">
      <h4 className="font-bold">Follow Debug Info (User: {userId.substring(0, 8)}...)</h4>
      
      <div className="grid grid-cols-2 gap-2">
        <div>
          <strong>Table Access:</strong> {debugInfo.followsTableExists ? '✅' : '❌'}
        </div>
        <div>
          <strong>Errors:</strong> {debugInfo.errors.length}
        </div>
        <div>
          <strong>Direct Followers:</strong> {debugInfo.followersCount}
        </div>
        <div>
          <strong>Direct Following:</strong> {debugInfo.followingCount}
        </div>
        <div>
          <strong>RPC Followers:</strong> {debugInfo.rpcFollowersCount ?? 'N/A'}
        </div>
        <div>
          <strong>RPC Following:</strong> {debugInfo.rpcFollowingCount ?? 'N/A'}
        </div>
      </div>

      {debugInfo.errors.length > 0 && (
        <div className="mt-2">
          <strong>Errors:</strong>
          <ul className="list-disc pl-4 text-red-600">
            {debugInfo.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {user && user.id !== userId && (
        <button
          onClick={createTestFollow}
          className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs"
        >
          Create Test Follow
        </button>
      )}

      {debugInfo.rawFollowersData.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer font-semibold">Raw Followers Data</summary>
          <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto max-h-32">
            {JSON.stringify(debugInfo.rawFollowersData, null, 2)}
          </pre>
        </details>
      )}

      {debugInfo.rawFollowingData.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer font-semibold">Raw Following Data</summary>
          <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto max-h-32">
            {JSON.stringify(debugInfo.rawFollowingData, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
} 