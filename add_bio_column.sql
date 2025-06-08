-- Add bio column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';

-- Comment explaining the column
COMMENT ON COLUMN profiles.bio IS 'User biography/description for curator profiles';
