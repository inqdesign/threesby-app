/*
  # Update RLS policies for public access

  1. Changes
    - Allow public access to all published picks
    - Allow public access to approved profiles
    - Maintain creator/admin management capabilities
    - Simplify policy structure

  2. Security
    - Public can read published content
    - Creators maintain control of their content
    - Admins retain management capabilities
*/

-- Drop existing pick policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for picks" ON picks;
DROP POLICY IF EXISTS "Enable read access for users" ON picks;
DROP POLICY IF EXISTS "Users can read published picks" ON picks;
DROP POLICY IF EXISTS "Users can read their own picks" ON picks;
DROP POLICY IF EXISTS "Public can read published picks" ON picks;

-- Create simplified pick policies
CREATE POLICY "Anyone can read published picks"
ON picks
FOR SELECT
USING (
  status = 'published' 
  AND visible = true
);

CREATE POLICY "Creators can manage their picks"
ON picks
FOR ALL
TO authenticated
USING (
  profile_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  profile_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Drop existing profile policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users" ON profiles;
DROP POLICY IF EXISTS "Public can read approved profiles" ON profiles;

-- Create simplified profile policies
CREATE POLICY "Anyone can read approved profiles"
ON profiles
FOR SELECT
USING (status = 'approved');

CREATE POLICY "Users can manage their own profile"
ON profiles
FOR ALL
TO authenticated
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);