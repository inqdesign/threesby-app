/*
  # Add RLS policies for featured picks

  1. Changes
    - Add RLS policy to allow admins to manage featured picks (null profile_id)
    - Add RLS policy to allow all users to read featured picks

  2. Security
    - Only admins can create/update/delete featured picks
    - All users can read featured picks
*/

-- Policy for admins to manage featured picks
CREATE POLICY "Admins can manage featured picks"
ON picks
FOR ALL
TO authenticated
USING (
  (
    -- Check if user is admin
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
    -- And this is a featured pick (null profile_id)
    AND profile_id IS NULL
  )
  OR
  -- Or it's their own pick
  (profile_id = auth.uid())
)
WITH CHECK (
  (
    -- Check if user is admin
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
    -- And this is a featured pick (null profile_id)
    AND profile_id IS NULL
  )
  OR
  -- Or it's their own pick
  (profile_id = auth.uid())
);

-- Policy for everyone to read featured picks
CREATE POLICY "Anyone can read featured picks"
ON picks
FOR SELECT
TO authenticated
USING (
  profile_id IS NULL
  AND status = 'published'
  AND visible = true
);