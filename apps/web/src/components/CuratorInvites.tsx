import React, { useState, useEffect } from 'react';
import { Copy, Share2, Check, Users, Calendar, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface CuratorInvite {
  id: string;
  code: string;
  status: 'pending' | 'completed' | 'expired';
  expires_at: string;
  created_at: string;
  used_by?: {
    id: string;
    full_name: string;
    username: string;
  };
  used_at?: string;
}

export function CuratorInvites() {
  const { user } = useAuth();
  const [invites, setInvites] = useState<CuratorInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchInvites();
    }
  }, [user]);

  const fetchInvites = async () => {
    try {
      const { data, error } = await supabase
        .from('curator_invites')
        .select(`
          id,
          code,
          status,
          expires_at,
          created_at,
          used_at,
          used_by:profiles!curator_invites_used_by_fkey (
            id,
            full_name,
            username
          )
        `)
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvites(data || []);
    } catch (error) {
      console.error('Error fetching invites:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      const inviteUrl = `${window.location.origin}/signup`;
      await navigator.clipboard.writeText(`Join me on Threesby! Use invitation code: ${code}\n\n${inviteUrl}`);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const shareInvite = async (code: string) => {
    const inviteUrl = `${window.location.origin}/signup`;
    const shareData = {
      title: 'Join me on Threesby!',
      text: `Use invitation code: ${code}`,
      url: inviteUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to copying
        await copyToClipboard(code);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getStatusColor = (status: string, expiresAt: string) => {
    if (status === 'completed') return 'text-green-600 bg-green-50';
    if (status === 'expired' || new Date(expiresAt) < new Date()) return 'text-red-600 bg-red-50';
    return 'text-blue-600 bg-blue-50';
  };

  const getStatusText = (status: string, expiresAt: string) => {
    if (status === 'completed') return 'Used';
    if (status === 'expired' || new Date(expiresAt) < new Date()) return 'Expired';
    return 'Available';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const availableInvites = invites.filter(invite => 
    invite.status === 'pending' && new Date(invite.expires_at) > new Date()
  );
  const usedInvites = invites.filter(invite => invite.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Users className="w-5 h-5 text-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Your Invitation Codes</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{availableInvites.length}</div>
          <div className="text-sm text-blue-600">Available</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{usedInvites.length}</div>
          <div className="text-sm text-green-600">Used</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">{invites.length}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
      </div>

      {/* Available Invites */}
      {availableInvites.length > 0 && (
        <div>
          <h3 className="text-md font-medium text-foreground mb-3">Available Invitations</h3>
          <div className="space-y-3">
            {availableInvites.map((invite) => (
              <div key={invite.id} className="border border-border rounded-lg p-4 bg-background">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="font-mono text-lg font-bold text-foreground bg-secondary px-3 py-1 rounded">
                      {invite.code}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Expires {formatDate(invite.expires_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(invite.code)}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-secondary hover:bg-muted rounded-lg transition-colors"
                    >
                      {copiedCode === invite.code ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-green-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => shareInvite(invite.code)}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-foreground text-background hover:bg-muted-foreground rounded-lg transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Used Invites */}
      {usedInvites.length > 0 && (
        <div>
          <h3 className="text-md font-medium text-foreground mb-3">Used Invitations</h3>
          <div className="space-y-3">
            {usedInvites.map((invite) => (
              <div key={invite.id} className="border border-border rounded-lg p-4 bg-background opacity-75">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="font-mono text-lg font-bold text-muted-foreground bg-secondary px-3 py-1 rounded line-through">
                      {invite.code}
                    </div>
                    {invite.used_by && (
                      <div className="text-sm text-muted-foreground">
                        <div>Used by <span className="font-medium">{invite.used_by.full_name}</span></div>
                        <div className="text-xs">@{invite.used_by.username} • {formatDate(invite.used_at!)}</div>
                      </div>
                    )}
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600">
                    Used
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {invites.length === 0 && (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Invitation Codes Yet</h3>
          <p className="text-muted-foreground">
            You'll receive 3 invitation codes once your curator application is approved.
          </p>
        </div>
      )}

      {/* Info */}
      <div className="bg-muted p-4 rounded-lg">
        <h4 className="font-medium text-foreground mb-2">How it works</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• You get 3 invitation codes as a curator</li>
          <li>• Each code can be used once to invite someone new</li>
          <li>• Codes expire after 30 days if unused</li>
          <li>• Share codes with people you'd like to join Threesby</li>
        </ul>
      </div>
    </div>
  );
} 