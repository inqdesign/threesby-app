/*
  # Add public access policies

  1. Changes
    - Add policies to allow public access to published picks and approved profiles
    - Remove authentication requirement from existing policies

  2. Security
    - Only published and visible picks are accessible
    - Only approved profiles are accessible
    - Sensitive data remains protected
*/

-- Update the "Anyone can read featured picks" policy to remove auth requirement
DROP POLICY IF EXISTS "Anyone can read featured picks" ON picks;
CREATE POLICY "Anyone can read featured picks"
ON picks
FOR SELECT
USING (
  profile_id IS NULL
  AND status = 'published'
  AND visible = true
);

-- Add policy for public access to published picks
CREATE POLICY "Public can read published picks"
ON picks
FOR SELECT
USING (
  status = 'published'
  AND visible = true
);

-- Add policy for public access to approved profiles
CREATE POLICY "Public can read approved profiles"
ON profiles
FOR SELECT
USING (
  status = 'approved'
);

-- Update existing policies to specify authenticated operations
DROP POLICY IF EXISTS "Enable read access for users" ON profiles;
CREATE POLICY "Enable read access for users"
ON profiles
FOR SELECT
TO authenticated
USING (
  (id = auth.uid() OR status = 'approved')
);

DROP POLICY IF EXISTS "Enable update for users" ON profiles;
CREATE POLICY "Enable update for users"
ON profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());