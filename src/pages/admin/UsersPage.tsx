import React, { useState, useEffect } from 'react';
import { User, Search, Filter, AlertCircle, Check, X, Loader2, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Profile {
  id: string;
  full_name: string;
  title: string;
  avatar_url: string | null;
  status: string;
  created_at: string;
  email: string;
  picks_count: number;
}

export function UsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'pending' | 'rejected'>('all');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, [activeFilter]);

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          title,
          avatar_url,
          status,
          created_at,
          email,
          picks:picks (count)
        `)
        .order('created_at', { ascending: false });

      // Apply status filter if not 'all'
      if (activeFilter !== 'all') {
        query = query.eq('status', activeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform data to include picks count
      const transformedData = data?.map((profile: any) => ({
        ...profile,
        picks_count: profile.picks?.length || 0,
        email: profile.email || 'No email'
      }));
      
      setProfiles(transformedData || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      setNotification({
        type: 'error',
        message: 'Failed to load user data'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (profileId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId);

      if (error) throw error;

      // Update local state
      setProfiles(profiles.map(profile => 
        profile.id === profileId 
          ? { ...profile, status: newStatus } 
          : profile
      ));
      
      setNotification({
        type: 'success',
        message: `User status successfully changed to ${newStatus}`
      });
    } catch (error) {
      console.error('Error changing user status:', error);
      setNotification({
        type: 'error',
        message: 'Error changing user status'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-50 text-green-600">Active</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-amber-50 text-amber-600">Pending</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-50 text-red-600">Rejected</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-50 text-gray-600">{status}</span>;
    }
  };

  const filteredProfiles = profiles.filter(profile => 
    profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#252525]">Users</h2>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {notification.type === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <p>{notification.message}</p>
          <button 
            onClick={() => setNotification(null)}
            className="ml-auto p-1 rounded-full hover:bg-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              activeFilter === 'all'
                ? 'bg-[#252525] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter('active')}
            className={`px-4 py-2 rounded-lg ${
              activeFilter === 'active'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-4 py-2 rounded-lg ${
              activeFilter === 'pending'
                ? 'bg-amber-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setActiveFilter('rejected')}
            className={`px-4 py-2 rounded-lg ${
              activeFilter === 'rejected'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Rejected
          </button>
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-500">No users found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4">User</th>
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Picks</th>
                <th className="text-left py-3 px-4">Joined</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProfiles.map((profile) => (
                <tr key={profile.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                        {profile.avatar_url ? (
                          <img 
                            src={profile.avatar_url} 
                            alt={profile.full_name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-[#252525]">{profile.full_name}</p>
                        <p className="text-xs text-gray-500">{profile.title || 'No title'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{profile.email}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(profile.status)}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {profile.picks_count}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      {profile.status !== 'approved' && (
                        <button
                          onClick={() => handleStatusChange(profile.id, 'approved')}
                          className="px-3 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100"
                        >
                          Approve
                        </button>
                      )}
                      {profile.status !== 'pending' && (
                        <button
                          onClick={() => handleStatusChange(profile.id, 'pending')}
                          className="px-3 py-1 text-xs bg-amber-50 text-amber-600 rounded hover:bg-amber-100"
                        >
                          Set Pending
                        </button>
                      )}
                      {profile.status !== 'rejected' && (
                        <button
                          onClick={() => handleStatusChange(profile.id, 'rejected')}
                          className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default UsersPage;
