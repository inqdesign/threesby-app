/*
  # Update Curator Invites and Waitlist Tables

  1. Changes to `curator_invites`
    - Add `full_name` column
    - Update existing data to have full_name from email prefix

  2. Changes to `waitlist`
    - Add `full_name` column (text)
    - Add `invite_code` column (text, optional)

  3. Security
    - Update RLS policies as needed
*/

-- Add full_name to curator_invites if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'curator_invites' 
                 AND column_name = 'full_name') THEN
    ALTER TABLE public.curator_invites ADD COLUMN full_name text;
  END IF;
END $$;

-- Add missing columns to waitlist table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'waitlist' 
                 AND column_name = 'full_name') THEN
    ALTER TABLE public.waitlist ADD COLUMN full_name text;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'waitlist' 
                 AND column_name = 'invite_code') THEN
    ALTER TABLE public.waitlist ADD COLUMN invite_code text;
  END IF;
END $$;

-- Update existing curator_invites to have full_name if null
UPDATE public.curator_invites 
SET full_name = COALESCE(full_name, split_part(email, '@', 1))
WHERE full_name IS NULL OR full_name = '';

-- Create index on waitlist invite_code for faster lookups
CREATE INDEX IF NOT EXISTS waitlist_invite_code_idx ON public.waitlist(invite_code);

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