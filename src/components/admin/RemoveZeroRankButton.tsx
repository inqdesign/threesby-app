import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export function RemoveZeroRankButton() {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{count?: number, success?: boolean, message?: string} | null>(null);
  
  // Only authenticated users should be able to use this feature
  if (!user?.id) return null;
  
  const removeZeroRankPicks = async () => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      setResult(null);
      
      // First, let's count how many picks have rank=0
      const { count, error: countError } = await supabase
        .from('picks')
        .select('*', { count: 'exact', head: true })
        .eq('rank', 0);
      
      if (countError) {
        console.error('Error counting picks with rank=0:', countError);
        setResult({ success: false, message: `Error counting picks: ${countError.message}` });
        return;
      }
      
      // If there are no picks with rank=0, we're done
      if (!count || count === 0) {
        setResult({ count: 0, success: true, message: 'No picks with rank=0 found. Nothing to remove.' });
        return;
      }
      
      // Ask for confirmation before proceeding
      const confirmation = window.confirm(`Are you sure you want to delete ${count || 0} picks with rank=0? This action cannot be undone.`);
      
      if (!confirmation) {
        setResult({ count: count || 0, success: false, message: 'Operation cancelled.' });
        return;
      }
      
      // Delete all picks with rank=0
      const { error: deleteError } = await supabase
        .from('picks')
        .delete()
        .eq('rank', 0);
      
      if (deleteError) {
        console.error('Error deleting picks with rank=0:', deleteError);
        setResult({ count: count || 0, success: false, message: `Error deleting picks: ${deleteError.message}` });
        return;
      }
      
      setResult({ count: count || 0, success: true, message: `Successfully removed ${count || 0} picks with rank=0.` });
      
    } catch (error) {
      console.error('Unexpected error:', error);
      setResult({ success: false, message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}` });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-medium mb-2">Database Maintenance</h3>
      <p className="text-sm text-gray-600 mb-4">
        Remove all picks with rank=0 from the database. This will permanently delete these items.
      </p>
      
      <button
        onClick={removeZeroRankPicks}
        disabled={isProcessing}
        className={`px-4 py-2 rounded-md text-white ${isProcessing ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'}`}
      >
        {isProcessing ? 'Processing...' : 'Remove #0 Picks'}
      </button>
      
      {result && (
        <div className={`mt-4 p-3 rounded-md ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {result.message}
        </div>
      )}
    </div>
  );
}
