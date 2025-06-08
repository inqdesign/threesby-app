/*
  # Fix admin policies to prevent recursion

  1. Changes
    - Modify admin policies to avoid recursive queries
    - Simplify policy conditions
    - Ensure proper access control

  2. Security
    - Maintain RLS security
    - Fix infinite recursion issues
    - Keep existing functionality
*/

-- First, add the is_admin column if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;

-- Drop existing policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
  DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
  DROP POLICY IF EXISTS "Admins can read all picks" ON picks;
  DROP POLICY IF EXISTS "Admins can update all picks" ON picks;
  DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
END $$;

-- Create base policies for profiles
CREATE POLICY "Enable read access for users"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    is_admin = true
  );

CREATE POLICY "Enable update for users"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid() OR
    is_admin = true
  );

-- Create policies for picks
CREATE POLICY "Enable read access for picks"
  ON picks
  FOR SELECT
  TO authenticated
  USING (
    profile_id = auth.uid() OR
    status = 'published' OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Enable update for picks"
  ON picks
  FOR UPDATE
  TO authenticated
  USING (
    profile_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );