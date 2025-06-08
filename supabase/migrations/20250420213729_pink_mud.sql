/*
  # Add Curator Invites System

  1. New Tables
    - `curator_invites`
      - `id` (uuid, primary key)
      - `code` (text, unique)
      - `email` (text, optional)
      - `full_name` (text)
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)
      - `created_by` (uuid, references profiles)
      - `status` (text) - pending, completed, expired

  2. Security
    - Enable RLS
    - Add policies for admin management
    - Add policies for public invite verification
*/

-- Create curator_invites table
CREATE TABLE IF NOT EXISTS public.curator_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  email text,
  full_name text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'expired'))
);

-- Enable RLS
ALTER TABLE public.curator_invites ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS curator_invites_code_idx ON public.curator_invites(code);
CREATE INDEX IF NOT EXISTS curator_invites_email_idx ON public.curator_invites(email);
CREATE INDEX IF NOT EXISTS curator_invites_status_idx ON public.curator_invites(status);

-- Create RLS policies
CREATE POLICY "Admins can manage invites"
ON public.curator_invites
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Anyone can verify invite codes"
ON public.curator_invites
FOR SELECT
TO public
USING (
  status = 'pending' AND
  expires_at > now()
);

-- Create function to verify invite
CREATE OR REPLACE FUNCTION verify_invite(invite_code text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM curator_invites 
    WHERE code = invite_code 
    AND status = 'pending'
    AND expires_at > now()
  );
$$;

-- Grant execute permission on verify_invite function
GRANT EXECUTE ON FUNCTION verify_invite TO anon, authenticated;