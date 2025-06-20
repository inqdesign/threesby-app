/*
  # Fix RLS Recursion in Profiles Table

  1. Changes
    - Remove recursive policy checks
    - Create non-recursive admin check function
    - Simplify RLS policies
    - Add proper indexes

  2. Security
    - Maintain data access control
    - Keep existing functionality
    - Prevent infinite recursion
*/

-- Drop existing RLS policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view approved profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users" ON public.profiles;

-- Create non-recursive admin check function
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  );
$$;

-- Grant execute permission on admin check function
GRANT EXECUTE ON FUNCTION is_admin_user TO authenticated;

-- Create simplified RLS policies
CREATE POLICY "Enable public read access"
  ON public.profiles
  FOR SELECT
  USING (
    status = 'approved'
    OR id = auth.uid()
    OR is_admin_user()
  );

CREATE POLICY "Enable authenticated user access"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (
    id = auth.uid()
    OR is_admin_user()
  )
  WITH CHECK (
    id = auth.uid()
    OR is_admin_user()
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;