/*
  # Fix publish_picks function to handle exclusion constraint

  This migration updates the publish_picks function to:
  1. Remove the exclusion constraint that's causing issues
  2. Add a check to ensure only one set of picks can be published per user
  3. Maintain data consistency with proper order of operations
*/

-- First, drop the problematic exclusion constraint
ALTER TABLE picks
DROP CONSTRAINT IF EXISTS unique_published_submission;

-- Create a new function to handle publishing picks
CREATE OR REPLACE FUNCTION publish_picks(p_profile_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  published_count INTEGER;
BEGIN
  -- Check if user already has published picks (excluding the ones we're about to update)
  SELECT COUNT(*)
  INTO published_count
  FROM picks
  WHERE profile_id = p_profile_id 
    AND status = 'published'
    AND id NOT IN (
      SELECT id 
      FROM picks 
      WHERE profile_id = p_profile_id 
        AND status = 'pending_review'
    );

  -- If there are other published picks (not the ones we're updating), raise an error
  IF published_count > 0 THEN
    RAISE EXCEPTION 'User already has published picks';
  END IF;

  -- Update profile status first
  UPDATE profiles
  SET 
    status = 'approved',
    updated_at = NOW()
  WHERE id = p_profile_id;

  -- Then update the picks status
  UPDATE picks
  SET 
    status = 'published',
    updated_at = NOW()
  WHERE 
    profile_id = p_profile_id 
    AND status = 'pending_review';
END;
$$;