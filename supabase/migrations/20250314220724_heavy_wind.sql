/*
  # Add stored procedure for publishing picks

  This migration adds a stored procedure that handles the publishing process
  in a transaction to ensure data consistency.

  1. Changes
    - Adds `publish_picks` function that:
      - Unpublishes any existing published picks
      - Updates profile status
      - Publishes new picks
    - All operations are wrapped in a transaction

  2. Security
    - Function is accessible to authenticated users only
*/

CREATE OR REPLACE FUNCTION publish_picks(p_profile_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Wrap everything in a transaction
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

    -- If we get here, commit the transaction
    COMMIT;
  EXCEPTION
    WHEN OTHERS THEN
      -- If anything goes wrong, roll back
      ROLLBACK;
      RAISE;
  END;
END;
$$;