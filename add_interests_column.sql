-- Add interests column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';

-- Comment explaining the column
COMMENT ON COLUMN profiles.interests IS 'Array of user interests as tags';
