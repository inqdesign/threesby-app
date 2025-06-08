import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import type { Pick } from '../types';
import { Eye, EyeOff } from 'lucide-react';

type PickStatusBadgeProps = {
  pick: Pick;
  onStatusChange?: () => void;
  showControls?: boolean;
};

export function PickStatusBadge({ pick, onStatusChange, showControls = false }: PickStatusBadgeProps) {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const isOwnPick = user?.id === pick.profile_id;
  
  // Only show controls if it's the user's own pick and showControls is true
  const showStatusControls = isOwnPick && showControls;
  
  const toggleStatus = async () => {
    if (!isOwnPick || loading) return;
    
    setLoading(true);
    try {
      const newStatus = pick.status === 'published' ? 'draft' : 'published';
      
      const { error } = await supabase
        .from('picks')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', pick.id);
        
      if (error) throw error;
      
      if (onStatusChange) onStatusChange();
    } catch (error) {
      console.error('Error updating pick status:', error);
      alert('Failed to update pick status. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Determine badge color based on status
  const getBadgeColor = () => {
    if (pick.status === 'published') return 'bg-green-100 text-green-800';
    if (pick.status === 'draft') return 'bg-gray-100 text-gray-800';
    return 'bg-gray-100 text-gray-800';
  };
  
  // If not showing controls and the pick is published, don't show anything
  if (!showControls && pick.status === 'published') return null;
  
  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor()}`}>
      {pick.status === 'published' ? (
        <>
          <Eye className="w-3 h-3 mr-1" />
          Published
        </>
      ) : (
        <>
          <EyeOff className="w-3 h-3 mr-1" />
          Draft
        </>
      )}
      
      {showStatusControls && (
        <button
          onClick={toggleStatus}
          disabled={loading}
          className="ml-2 text-xs underline hover:no-underline focus:outline-none"
        >
          {loading ? '...' : pick.status === 'published' ? 'Make Draft' : 'Publish'}
        </button>
      )}
    </div>
  );
}
