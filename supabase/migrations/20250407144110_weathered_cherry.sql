/*
  # Add follows table for user relationships

  1. New Tables
    - `follows`
      - `id` (uuid, primary key)
      - `follower_id` (uuid, references profiles.id)
      - `following_id` (uuid, references profiles.id)
      - `created_at` (timestamp with time zone)

  2. Indexes
    - Composite index on (follower_id, following_id) for efficient lookups
    - Individual indexes on follower_id and following_id

  3. Security
    - Enable RLS
    - Add policies for:
      - Authenticated users can create/delete their own follows
      - Anyone can view follows
*/

-- Create follows table
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

-- Policies
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