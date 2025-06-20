/*
  # Curator Invitation System Enhancement

  1. Add columns to track invitation relationships
    - `invited_by` (uuid) - tracks who created this invite
    - `used_by` (uuid) - tracks who used this invite  
    - `used_at` (timestamptz) - when the invite was used

  2. Add RLS policies for curators to manage their own invites

  3. Create function to auto-generate curator invites

  4. Create trigger to generate invites when curator is approved
*/

-- Add new columns to curator_invites table
ALTER TABLE public.curator_invites 
ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS used_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS used_at timestamptz;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS curator_invites_invited_by_idx ON public.curator_invites(invited_by);
CREATE INDEX IF NOT EXISTS curator_invites_used_by_idx ON public.curator_invites(used_by);
CREATE INDEX IF NOT EXISTS curator_invites_used_at_idx ON public.curator_invites(used_at);

-- Add RLS policy for curators to view their own invites
CREATE POLICY "Curators can view their own invites"
ON public.curator_invites
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Add RLS policy for curators to update their own invites (mark as used)
CREATE POLICY "Curators can update their own invites"
ON public.curator_invites
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Function to generate 3 invitation codes for a curator
CREATE OR REPLACE FUNCTION generate_curator_invites(curator_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  i integer;
  new_code text;
BEGIN
  -- Generate 3 invitation codes for the curator
  FOR i IN 1..3 LOOP
    -- Generate unique code
    new_code := upper(encode(gen_random_bytes(4), 'hex'));
    
    -- Ensure code is unique
    WHILE EXISTS (SELECT 1 FROM curator_invites WHERE code = new_code) LOOP
      new_code := upper(encode(gen_random_bytes(4), 'hex'));
    END LOOP;
    
    -- Insert the invitation
    INSERT INTO public.curator_invites (
      code,
      full_name,
      expires_at,
      created_by,
      status
    ) VALUES (
      new_code,
      'Invitation ' || i || ' by ' || (SELECT full_name FROM profiles WHERE id = curator_id),
      now() + interval '30 days', -- 30 days expiration for curator invites
      curator_id,
      'pending'
    );
  END LOOP;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION generate_curator_invites TO authenticated;

-- Function to handle curator approval and generate invites
CREATE OR REPLACE FUNCTION handle_curator_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if status changed to 'approved' and user is a creator
  IF NEW.status = 'approved' AND OLD.status != 'approved' AND NEW.is_creator = true THEN
    -- Generate 3 invitation codes for the newly approved curator
    PERFORM generate_curator_invites(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for curator approval
DROP TRIGGER IF EXISTS on_curator_approved ON public.profiles;
CREATE TRIGGER on_curator_approved
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_curator_approval();

-- Function to mark invitation as used and track relationships
CREATE OR REPLACE FUNCTION mark_invitation_used(invite_code text, user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invite_record curator_invites%ROWTYPE;
BEGIN
  -- Get the invitation record
  SELECT * INTO invite_record
  FROM curator_invites
  WHERE code = invite_code
  AND status = 'pending'
  AND expires_at > now();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation code';
  END IF;
  
  -- Update the invitation as used
  UPDATE curator_invites
  SET 
    status = 'completed',
    used_by = user_id,
    used_at = now()
  WHERE id = invite_record.id;
  
  -- Update the user's profile to track who invited them
  UPDATE profiles
  SET invited_by = invite_record.created_by
  WHERE id = user_id;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION mark_invitation_used TO authenticated;

-- Add invited_by column to profiles table to track invitation relationships
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create index for invited_by
CREATE INDEX IF NOT EXISTS profiles_invited_by_idx ON public.profiles(invited_by); 