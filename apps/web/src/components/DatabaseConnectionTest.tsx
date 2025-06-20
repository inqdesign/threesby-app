import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function DatabaseConnectionTest() {
  const [status, setStatus] = useState<string>('Testing...');
  const [details, setDetails] = useState<any[]>([]);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    const results: any[] = [];
    
    try {
      // Test 1: Basic Supabase connection
      results.push('✅ Supabase client initialized');
      
      // Test 2: Check if we can query profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .limit(1);
      
      if (profilesError) {
        results.push(`❌ Profiles table error: ${profilesError.message}`);
      } else {
        results.push(`✅ Profiles table accessible (${profiles?.length || 0} records found)`);
      }

      // Test 3: Check if follows table exists
      const { data: followsData, error: followsError } = await supabase
        .from('follows')
        .select('id')
        .limit(1);
      
      if (followsError) {
        results.push(`❌ Follows table error: ${followsError.message}`);
        results.push(`Error details: ${JSON.stringify(followsError, null, 2)}`);
      } else {
        results.push(`✅ Follows table accessible (${followsData?.length || 0} records found)`);
      }

      // Test 4: Test RPC functions
      try {
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_follower_count', { profile_id: '00000000-0000-0000-0000-000000000000' });
        
        if (rpcError) {
          results.push(`❌ RPC function error: ${rpcError.message}`);
        } else {
          results.push(`✅ RPC functions working (returned: ${rpcData})`);
        }
      } catch (rpcErr) {
        results.push(`❌ RPC function exception: ${rpcErr}`);
      }

      // Test 5: Check current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        results.push(`❌ Auth error: ${userError.message}`);
      } else if (user) {
        results.push(`✅ User authenticated: ${user.email}`);
      } else {
        results.push(`⚠️ No authenticated user`);
      }

      setStatus('Connection test completed');
      setDetails(results);
      
    } catch (error) {
      results.push(`❌ General error: ${error}`);
      setStatus('Connection test failed');
      setDetails(results);
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-gray-300 rounded-lg p-4 max-w-md shadow-lg z-50">
      <div className="text-sm font-bold mb-2">Database Connection Test</div>
      <div className="text-xs text-gray-600 mb-2">{status}</div>
      <div className="text-xs space-y-1 max-h-60 overflow-y-auto">
        {details.map((detail, index) => (
          <div key={index} className="font-mono">
            {detail}
          </div>
        ))}
      </div>
      <button 
        onClick={testConnection}
        className="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded"
      >
        Retest
      </button>
    </div>
  );
} 