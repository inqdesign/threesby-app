// Script to remove all picks with rank=0 from the database
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function removeZeroRankPicks() {
  console.log('Starting removal of picks with rank=0...');
  
  try {
    // First, let's count how many picks have rank=0
    const { count, error: countError } = await supabase
      .from('picks')
      .select('*', { count: 'exact', head: true })
      .eq('rank', 0);
    
    if (countError) {
      console.error('Error counting picks with rank=0:', countError);
      return;
    }
    
    console.log(`Found ${count} picks with rank=0`);
    
    // If there are no picks with rank=0, we're done
    if (count === 0) {
      console.log('No picks with rank=0 found. Nothing to remove.');
      return;
    }
    
    // Ask for confirmation before proceeding
    const confirmation = confirm(`Are you sure you want to delete ${count} picks with rank=0? This action cannot be undone.`);
    
    if (!confirmation) {
      console.log('Operation cancelled by user.');
      return;
    }
    
    // Delete all picks with rank=0
    const { error: deleteError } = await supabase
      .from('picks')
      .delete()
      .eq('rank', 0);
    
    if (deleteError) {
      console.error('Error deleting picks with rank=0:', deleteError);
      return;
    }
    
    console.log(`Successfully removed ${count} picks with rank=0.`);
    
    // Refresh the page to show the changes
    window.location.reload();
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Execute the function
removeZeroRankPicks();
