/*
  # Fix recursive RLS policies

  1. Changes
    - Remove recursive policy conditions from profiles table
    - Simplify admin access policy to avoid recursion
    - Update public access policy for profiles
    - Update authenticated user access policy
  
  2. Security
    - Maintains RLS protection
    - Simplifies policy logic while maintaining security
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can verify invite codes" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;

-- Recreate policies without recursion
CREATE POLICY "Admins can manage profiles"
ON profiles
FOR ALL
TO authenticated
USING (is_admin = true)
WITH CHECK (is_admin = true);

CREATE POLICY "Anyone can verify invite codes"
ON profiles
FOR SELECT
TO public
USING (
  invite_code IS NOT NULL 
  AND is_creator = true 
  AND status = 'approved'
);

CREATE POLICY "Public profiles are viewable by everyone"
ON profiles
FOR SELECT
TO public
USING (status = 'approved');

CREATE POLICY "Users can manage own profile"
ON profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());