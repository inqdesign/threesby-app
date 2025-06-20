/*
  # Fix publish_picks function transaction handling

  This migration updates the publish_picks function to:
  1. Remove explicit transaction management (as RPC calls are already in a transaction)
  2. Maintain atomic operations for publishing picks
  
  Changes:
  - Removes BEGIN/COMMIT/ROLLBACK statements
  - Keeps the core logic for publishing picks
  - Maintains data consistency with proper order of operations
*/

CREATE OR REPLACE FUNCTION publish_picks(p_profile_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First, unpublish any existing published picks
  UPDATE picks
  SET 
    status = 'draft',
    updated_at = NOW()
  WHERE 
    profile_id = p_profile_id 
    AND status = 'published';

  -- Update profile status
  UPDATE profiles
  SET 
    status = 'approved',
    updated_at = NOW()
  WHERE id = p_profile_id;

  -- Publish the pending picks
  UPDATE picks
  SET 
    status = 'published',
    updated_at = NOW()
  WHERE 
    profile_id = p_profile_id 
    AND status = 'pending_review';
END;
$$;