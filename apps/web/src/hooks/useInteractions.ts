import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useInteractions() {
  const [loading, setLoading] = useState(false);

  const savePick = useCallback(async (pickId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('saved_picks')
        .upsert({ 
          user_id: user.id,
          pick_id: pickId 
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving pick:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const unsavePick = useCallback(async (pickId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('saved_picks')
        .delete()
        .match({ 
          user_id: user.id,
          pick_id: pickId 
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error unsaving pick:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const isSaved = useCallback(async (pickId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('saved_picks')
      .select('id')
      .match({
        user_id: user.id,
        pick_id: pickId
      })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error checking saved status:', error);
      return false;
    }
    return !!data;
  }, []);

  return {
    savePick,
    unsavePick,
    isSaved,
    loading
  };
}