/*
  # Add creator role and invite system

  1. Updates
    - Add is_creator boolean to profiles
    - Add invite_code column for tracking invites
    - Add indexes for faster lookups

  2. Security
    - Update RLS policies to handle creator role
*/

-- Add new columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_creator boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS invite_code text UNIQUE;

-- Create index for invite codes
CREATE INDEX IF NOT EXISTS idx_profiles_invite_code ON profiles(invite_code);

-- Update RLS policies for creator access
CREATE POLICY "Creators can access their content"
ON picks
FOR ALL
TO authenticated
USING (
  (profile_id = auth.uid() AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND (is_creator = true OR is_admin = true)
  ))
)
WITH CHECK (
  (profile_id = auth.uid() AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND (is_creator = true OR is_admin = true)
  ))
);