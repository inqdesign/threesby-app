/*
  # Add follows table and related features

  1. New Tables
    - `follows`
      - `id` (uuid, primary key)
      - `follower_id` (uuid, references profiles)
      - `following_id` (uuid, references profiles)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `follows` table
    - Add policies for authenticated users to manage their follows
    - Add policies for reading public follow data

  3. Functions
    - Add function to get follower count
    - Add function to get following count
    - Add function to check if user is following another user
*/

-- Create follows table
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Enable RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- Policies
CREATE POLICY "Users can manage their own follows"
ON follows
FOR ALL
TO authenticated
USING (follower_id = auth.uid())
WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Anyone can read follows"
ON follows
FOR SELECT
TO authenticated
USING (true);

-- Helper functions
CREATE OR REPLACE FUNCTION get_follower_count(profile_id uuid)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COUNT(*)
  FROM follows
  WHERE following_id = profile_id;
$$;

CREATE OR REPLACE FUNCTION get_following_count(profile_id uuid)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COUNT(*)
  FROM follows
  WHERE follower_id = profile_id;
$$;

CREATE OR REPLACE FUNCTION is_following(follower uuid, following uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM follows
    WHERE follower_id = follower
    AND following_id = following
  );
$$;