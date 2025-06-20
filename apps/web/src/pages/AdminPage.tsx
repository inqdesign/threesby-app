import React, { useState, useEffect } from 'react';
import { 
  Users, BookOpen, Package, MapPin, CheckCircle, 
  AlertCircle, X, Check, Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { RemoveZeroRankButton } from '../components/admin/RemoveZeroRankButton';
import { AdminLayout } from '../layouts/AdminLayout';

interface DashboardStats {
  totalUsers: number;
  activeInvites: number;
  places: number;
  products: number;
  books: number;
  pendingSubmissions: number;
}

interface Submission {
  id: string;
  profile_id: string;
  status: string;
  created_at: string;
  profile: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface StatItem {
  label: string;
  value: number;
  icon: React.ComponentType<any>;
  color?: string;
}

export function AdminPage() {
  // Remove location-based active section since we're using pure admin layout
  const [activeSection, setActiveSection] = useState('dashboard');

  // Dashboard stats state
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeInvites: 0,
    places: 0,
    products: 0,
    books: 0,
    pendingSubmissions: 0,
  });
  
  // Submissions state
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Stat items for dashboard
  const statItems: StatItem[] = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-blue-50 text-blue-500' },
    { label: 'Active Invites', value: stats.activeInvites, icon: CheckCircle, color: 'bg-purple-50 text-purple-500' },
    { label: 'Pending Submissions', value: stats.pendingSubmissions, icon: CheckCircle, color: 'bg-amber-50 text-amber-500' },
    { label: 'Places', value: stats.places, icon: MapPin, color: 'bg-green-50 text-green-500' },
    { label: 'Products', value: stats.products, icon: Package, color: 'bg-indigo-50 text-indigo-500' },
    { label: 'Books', value: stats.books, icon: BookOpen, color: 'bg-rose-50 text-rose-500' },
  ];

  // Fetch data on component mount
  useEffect(() => {
    fetchStats();
    fetchSubmissions();
  }, []);

  // Removed location-based section updates since we're using pure admin layout

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Fetch dashboard statistics
  const fetchStats = async () => {
    setLoading(true);
    try {
      const [
        { count: totalUsers },
        { count: activeInvites },
        { count: places },
        { count: products },
        { count: books },
        { count: pendingSubmissions },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase
          .from('curator_invites')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString()),
        supabase
          .from('picks')
          .select('*', { count: 'exact', head: true })
          .eq('category', 'places')
          .eq('status', 'published'),
        supabase
          .from('picks')
          .select('*', { count: 'exact', head: true })
          .eq('category', 'products')
          .eq('status', 'published'),
        supabase
          .from('picks')
          .select('*', { count: 'exact', head: true })
          .eq('category', 'books')
          .eq('status', 'published'),
        supabase
          .from('submission_reviews')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
      ]);

      setStats({
        totalUsers: totalUsers || 0,
        activeInvites: activeInvites || 0,
        places: places || 0,
        products: products || 0,
        books: books || 0,
        pendingSubmissions: pendingSubmissions || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setNotification({
        type: 'error',
        message: 'Failed to load dashboard statistics'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending submissions
  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submission_reviews')
        .select(`
          id,
          profile_id,
          status,
          created_at,
          profile:profiles!submission_reviews_profile_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match the Submission type
      const transformedData = data?.map((item: any) => ({
        id: item.id,
        profile_id: item.profile_id,
        status: item.status,
        created_at: item.created_at,
        profile: item.profile ? {
          full_name: item.profile.full_name || 'Unknown User',
          avatar_url: item.profile.avatar_url
        } : {
          full_name: 'Unknown User',
          avatar_url: null
        }
      }));
      
      setSubmissions(transformedData || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setNotification({
        type: 'error',
        message: 'Failed to load submission data'
      });
    }
  };

  // Approve a submission
  const handleApprove = async (submissionId: string, profileId: string) => {
    setActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Admin not authenticated');

      // First, check if the profile has at least 9 picks (3 per category)
      const { data: picksData, error: picksError } = await supabase
        .from('picks')
        .select('category')
        .eq('profile_id', profileId);

      if (picksError) throw picksError;

      // Count picks by category
      const pickCounts = {
        books: 0,
        products: 0,
        places: 0
      };

      picksData?.forEach(pick => {
        if (pick.category in pickCounts) {
          pickCounts[pick.category as keyof typeof pickCounts]++;
        }
      });

      // Check if each category has at least 3 picks
      const hasRequiredPicks = 
        pickCounts.books >= 3 && 
        pickCounts.products >= 3 && 
        pickCounts.places >= 3;

      if (!hasRequiredPicks) {
        setNotification({
          type: 'error',
          message: 'Cannot approve profile. It must have at least 3 picks in each category.'
        });
        return;
      }

      // Update profile status to 'active'
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId);
        
      if (profileError) throw profileError;

      // Update submission review status
      const { error: submissionError } = await supabase
        .from('submission_reviews')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', submissionId);
        
      if (submissionError) throw submissionError;

      // Send notification of success
      setNotification({
        type: 'success',
        message: 'Profile successfully approved'
      });

      // Refresh submissions list
      await fetchSubmissions();
      await fetchStats();
    } catch (error) {
      console.error('Error approving submission:', error);
      setNotification({
        type: 'error',
        message: 'Error approving submission'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Reject a submission
  const handleReject = async (submissionId: string, profileId: string, note: string) => {
    setActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Admin not authenticated');

      // Update profile status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          status: 'rejected',
          rejection_note: note,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId);
        
      if (profileError) throw profileError;

      // Update submission review status
      const { error: submissionError } = await supabase
        .from('submission_reviews')
        .update({
          status: 'rejected',
          rejection_note: note,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', submissionId);
        
      if (submissionError) throw submissionError;

      // Send notification of success
      setNotification({
        type: 'success',
        message: 'Profile successfully rejected'
      });

      // Refresh submissions list
      await fetchSubmissions();
      await fetchStats();
    } catch (error) {
      console.error('Error rejecting submission:', error);
      setNotification({
        type: 'error',
        message: 'Error rejecting submission'
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm animate-pulse">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                    <div className="h-6 w-16 bg-gray-200 rounded"></div>
                  </div>
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            ))
          ) : (
            statItems.map((stat) => (
              <div key={stat.label} className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-semibold mt-1 text-[#252525]">
                      {stat.value.toLocaleString()}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stat.color || 'bg-gray-50 text-gray-400'}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Main Content Area */}
        {activeSection === 'submissions' ? (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6 text-[#252525]">Pending Submissions</h2>
            {submissions.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-500">No pending submissions.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div key={submission.id} className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center gap-4">
                      <img
                        src={submission.profile.avatar_url || 'https://via.placeholder.com/40'}
                        alt={submission.profile.full_name}
                        className="w-10 h-10 rounded-full object-cover bg-gray-100"
                      />
                      <div>
                        <p className="font-medium text-[#252525]">{submission.profile.full_name}</p>
                        <p className="text-sm text-gray-500">
                          Submitted on {new Date(submission.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(submission.id, submission.profile_id)}
                        disabled={actionLoading}
                        className="flex items-center gap-1 px-4 py-2 bg-[#252525] text-white rounded-lg hover:bg-[#3a3a3a] transition-colors disabled:opacity-50"
                      >
                        {actionLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Approve
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          const note = prompt('Enter rejection note:');
                          if (note) handleReject(submission.id, submission.profile_id, note);
                        }}
                        disabled={actionLoading}
                        className="flex items-center gap-1 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeSection === 'invites' ? (
          <div className="py-4 text-center">
            {/* Content for Invites section */}
            <p>Invites content will be displayed here.</p>
          </div>
        ) : activeSection === 'users' ? (
          <div className="py-4 text-center">
            {/* Content for Users section */}
            <p>Users content will be displayed here.</p>
          </div>
        ) : activeSection === 'content' ? (
          <div className="py-4">
            <h2 className="text-xl font-semibold mb-6 text-[#252525] text-center">Content Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RemoveZeroRankButton />
              <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                <h3 className="text-lg font-medium mb-2">Content Statistics</h3>
                <p className="text-sm text-gray-600">Additional content management tools will be added here.</p>
              </div>
            </div>
          </div>
        ) : activeSection === 'settings' ? (
          <div className="py-4 text-center">
            {/* Content for Settings section */}
            <p>Settings content will be displayed here.</p>
          </div>
        ) : (
          <div className="py-4 text-center">
            {/* Dashboard content is displayed by default */}
            <p>Welcome to the admin dashboard.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminPage;
