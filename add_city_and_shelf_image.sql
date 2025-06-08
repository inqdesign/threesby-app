-- Add current_city column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS current_city TEXT DEFAULT '';

-- Add shelf_image_url column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS shelf_image_url TEXT DEFAULT '';

-- Comments explaining the columns
COMMENT ON COLUMN profiles.current_city IS 'Current city of the user/curator';
COMMENT ON COLUMN profiles.shelf_image_url IS 'URL to the shelf image displayed on the profile page';
