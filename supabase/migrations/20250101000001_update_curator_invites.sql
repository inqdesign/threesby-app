/*
  # Update Curator Invites Table for Better Tracking

  1. New Columns
    - `used_by` (uuid) - references the user who used the code
    - `used_at` (timestamptz) - when the code was used

  2. Updates
    - Add foreign key constraint for used_by
    - Add indexes for better performance
*/

-- Add tracking columns to curator_invites table
ALTER TABLE public.curator_invites
ADD COLUMN IF NOT EXISTS used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS used_at timestamptz;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS curator_invites_used_by_idx ON public.curator_invites(used_by);
CREATE INDEX IF NOT EXISTS curator_invites_used_at_idx ON public.curator_invites(used_at);

-- Create a function to generate unique invite codes
CREATE OR REPLACE FUNCTION generate_unique_invite_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Generate a random 8-character alphanumeric code
    new_code := upper(encode(gen_random_bytes(4), 'hex'));
    
    -- Check if code already exists
    SELECT EXISTS(
      SELECT 1 FROM curator_invites WHERE code = new_code
    ) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION generate_unique_invite_code TO authenticated; 