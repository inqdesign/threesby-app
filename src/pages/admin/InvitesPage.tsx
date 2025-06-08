import React, { useState, useEffect } from 'react';
import { Plus, Check, X, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { InviteCuratorModal } from '../../components/admin/InviteCuratorModal';

type Invite = {
  id: string;
  code: string;
  email: string | null;
  full_name: string;
  expires_at: string;
  created_at: string;
  status: 'pending' | 'completed' | 'expired';
};

export function InvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    try {
      const { data, error } = await supabase
        .from('curator_invites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvites(data || []);
    } catch (error) {
      console.error('Error fetching invites:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string, expiresAt: string) => {
    if (new Date(expiresAt) < new Date()) return 'text-red-600 bg-red-50';
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4" />;
      case 'expired':
        return <X className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Curator Invites</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#252525] text-white rounded-lg hover:bg-[#111111] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Invite
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4">Name</th>
              <th className="text-left py-3 px-4">Email</th>
              <th className="text-left py-3 px-4">Code</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Created</th>
              <th className="text-left py-3 px-4">Expires</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invites.map((invite) => (
              <tr key={invite.id} className="hover:bg-gray-50">
                <td className="py-3 px-4">{invite.full_name}</td>
                <td className="py-3 px-4">{invite.email || '-'}</td>
                <td className="py-3 px-4">
                  <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                    {invite.code}
                  </code>
                </td>
                <td className="py-3 px-4">
                  <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-sm ${
                    getStatusColor(invite.status, invite.expires_at)
                  }`}>
                    {getStatusIcon(invite.status)}
                    <span>{invite.status}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-500">
                  {new Date(invite.created_at).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 text-sm text-gray-500">
                  {new Date(invite.expires_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InviteCuratorModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          fetchInvites();
        }}
      />
    </div>
  );
}

export default InvitesPage;