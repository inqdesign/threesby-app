/*
  # Update Profile Schema and Picks

  1. Changes to Profiles Table
    - Add title field
    - Add social links
    - Add message field
  
  2. Changes to Picks Table
    - Add location/brand/author field
*/

-- Update profiles table with new fields
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS message text;

-- Update picks table with new field
ALTER TABLE picks
ADD COLUMN IF NOT EXISTS reference text NOT NULL DEFAULT '';

-- Update reference constraint based on category
ALTER TABLE picks
ADD CONSTRAINT valid_reference CHECK (
  CASE category
    WHEN 'places' THEN reference IS NOT NULL -- Location
    WHEN 'products' THEN reference IS NOT NULL -- Brand
    WHEN 'books' THEN reference IS NOT NULL -- Author
    ELSE false
  END
);