-- Script to check and fix the follows table
-- Run this in your Supabase SQL Editor

-- First, check if the follows table exists
SELECT 
  table_name, 
  table_schema
FROM information_schema.tables 
WHERE table_name = 'follows' AND table_schema = 'public';

-- If the above query returns no rows, the table doesn't exist
-- Run the following to create it:

-- Create follows table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS follows_follower_id_idx ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_id_idx ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS follows_follower_following_idx ON public.follows(follower_id, following_id);

-- Enable RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view follows" ON public.follows;
DROP POLICY IF EXISTS "Users can manage their own follows" ON public.follows;

-- Create policies
CREATE POLICY "Anyone can view follows"
  ON public.follows
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can manage their own follows"
  ON public.follows
  FOR ALL
  TO authenticated
  USING (auth.uid() = follower_id)
  WITH CHECK (auth.uid() = follower_id);

-- Create functions for counting followers/following
CREATE OR REPLACE FUNCTION public.get_follower_count(profile_id uuid)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)
  FROM follows
  WHERE following_id = profile_id;
$$;

CREATE OR REPLACE FUNCTION public.get_following_count(profile_id uuid)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)
  FROM follows
  WHERE follower_id = profile_id;
$$;

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION public.get_follower_count(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_following_count(uuid) TO authenticated, anon;

-- Check the final state
SELECT 
  'follows table created successfully' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'follows' AND table_schema = 'public') as table_exists,
  (SELECT COUNT(*) FROM information_schema.table_privileges WHERE table_name = 'follows' AND table_schema = 'public') as permissions_count;

-- Show any existing follows data
SELECT COUNT(*) as existing_follows_count FROM public.follows; 