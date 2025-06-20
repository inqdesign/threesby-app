import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AdminLayout } from '../../layouts/AdminLayout';

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

export function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchSubmissions = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
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

      // Update profile status to 'approved'
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId);
        
      if (profileError) throw profileError;

      // Update all the user's picks to 'published' status
      const { error: publishPicksError } = await supabase
        .from('picks')
        .update({
          status: 'published',
          updated_at: new Date().toISOString(),
        })
        .eq('profile_id', profileId);

      if (publishPicksError) throw publishPicksError;

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
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#252525]">Pending Submissions</h2>
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

      {/* Submissions List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-500">No pending submissions.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <div key={submission.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
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
    </AdminLayout>
  );
}

export default SubmissionsPage;
