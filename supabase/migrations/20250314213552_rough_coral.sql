/*
  # Submission Management Updates
  
  1. Changes
    - Add unique constraint to ensure only one published submission per user
    - Add visibility flag for picks to allow show/hide functionality
    
  2. Security
    - Update RLS policies to respect visibility flag
*/

-- Add visibility column to picks table
ALTER TABLE picks 
ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT true;

-- Create a unique constraint to ensure only one published submission per user
DO $$
BEGIN
  -- First, unpublish any duplicate published picks
  WITH ranked_picks AS (
    SELECT 
      id,
      profile_id,
      ROW_NUMBER() OVER (
        PARTITION BY profile_id 
        ORDER BY updated_at DESC
      ) as rn
    FROM picks
    WHERE status = 'published'
  )
  UPDATE picks
  SET status = 'draft'
  WHERE id IN (
    SELECT id 
    FROM ranked_picks 
    WHERE rn > 1
  );

  -- Now create the unique constraint
  ALTER TABLE picks
  ADD CONSTRAINT unique_published_submission
  EXCLUDE USING btree (profile_id WITH =)
  WHERE (status = 'published');
END $$;

-- Update RLS policies to respect visibility flag
DROP POLICY IF EXISTS "Enable read access for picks" ON picks;
CREATE POLICY "Enable read access for picks"
ON picks FOR SELECT
TO authenticated
USING (
  (profile_id = auth.uid()) OR 
  (status = 'published' AND visible = true) OR 
  (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  ))
);