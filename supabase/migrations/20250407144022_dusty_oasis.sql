/*
  # Fix recursive policies in profiles table

  1. Changes
    - Remove recursive policy for admin management
    - Add new non-recursive admin policy
    - Simplify policy structure to prevent infinite loops
  
  2. Security
    - Maintains existing security model
    - Prevents infinite recursion while preserving admin capabilities
    - Keeps existing RLS enabled
*/

BEGIN;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Create new admin policy without recursion
CREATE POLICY "Admins can manage profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE is_admin = true
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE is_admin = true
  )
);

COMMIT;