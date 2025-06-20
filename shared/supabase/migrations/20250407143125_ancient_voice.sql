-- Add policy to allow public access to verify invite codes
CREATE POLICY "Anyone can verify invite codes"
  ON public.profiles
  FOR SELECT
  USING (
    invite_code IS NOT NULL 
    AND is_creator = true 
    AND status = 'approved'
  );

-- Create function to verify invite code
CREATE OR REPLACE FUNCTION verify_invite_code(code text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE invite_code = code 
    AND is_creator = true 
    AND status = 'approved'
  );
$$;

-- Grant execute permission on verify_invite_code function
GRANT EXECUTE ON FUNCTION verify_invite_code TO anon, authenticated;