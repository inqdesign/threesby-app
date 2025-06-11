-- Create test follow relationships
-- Note: This script is for testing purposes only

-- First, let's see if we have any existing profiles to work with
-- This script assumes there are at least 2 profiles in the system

-- Add some test follow relationships if we have profiles
INSERT INTO public.follows (follower_id, following_id)
SELECT 
  p1.id as follower_id,
  p2.id as following_id
FROM 
  public.profiles p1, 
  public.profiles p2
WHERE 
  p1.id != p2.id  -- Don't follow yourself
  AND p1.status = 'approved'  -- Only approved profiles
  AND p2.status = 'approved'  -- Only follow approved profiles
  AND NOT EXISTS (
    -- Avoid duplicates
    SELECT 1 FROM public.follows f 
    WHERE f.follower_id = p1.id AND f.following_id = p2.id
  )
LIMIT 20  -- Limit to 20 test relationships
ON CONFLICT (follower_id, following_id) DO NOTHING;

-- Check if we successfully created test data
SELECT 
  'Test follows created' as message,
  COUNT(*) as total_follows
FROM public.follows;

-- Show some sample follow counts per user
SELECT 
  p.full_name,
  p.id,
  (SELECT COUNT(*) FROM public.follows WHERE following_id = p.id) as followers_count,
  (SELECT COUNT(*) FROM public.follows WHERE follower_id = p.id) as following_count
FROM public.profiles p
WHERE p.status = 'approved'
ORDER BY followers_count DESC
LIMIT 10; 