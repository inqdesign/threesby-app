/*
  # Platform Improvements

  1. New Features
    - Comments system
    - Tags system
    - Analytics tracking
    - Pick revisions

  2. Security
    - Enable RLS on new tables
    - Add appropriate policies
*/

-- Add tags system
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pick_tags (
  pick_id uuid REFERENCES picks(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (pick_id, tag_id)
);

-- Add comments system
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pick_id uuid REFERENCES picks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add analytics
CREATE TABLE IF NOT EXISTS pick_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pick_id uuid REFERENCES picks(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  viewed_at timestamptz DEFAULT now()
);

-- Add pick revisions
CREATE TABLE IF NOT EXISTS pick_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pick_id uuid REFERENCES picks(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  image_url text NOT NULL,
  reference text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE pick_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pick_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE pick_revisions ENABLE ROW LEVEL SECURITY;

-- Tags policies
CREATE POLICY "Public can read tags"
  ON tags FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage tags"
  ON tags FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  ));

-- Pick tags policies
CREATE POLICY "Public can read pick tags"
  ON pick_tags FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Creators can manage their pick tags"
  ON pick_tags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM picks
      WHERE picks.id = pick_id
      AND picks.profile_id = auth.uid()
    )
  );

-- Comments policies
CREATE POLICY "Public can read comments"
  ON comments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Analytics policies
CREATE POLICY "Creators can view their pick analytics"
  ON pick_views FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM picks
      WHERE picks.id = pick_id
      AND picks.profile_id = auth.uid()
    )
  );

-- Pick revisions policies
CREATE POLICY "Creators can view their pick revisions"
  ON pick_revisions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM picks
      WHERE picks.id = pick_id
      AND picks.profile_id = auth.uid()
    )
  );

-- Create functions for analytics
CREATE OR REPLACE FUNCTION get_pick_views(p_pick_id uuid)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COUNT(DISTINCT viewer_id)
  FROM pick_views
  WHERE pick_id = p_pick_id;
$$;

-- Create function to record view
CREATE OR REPLACE FUNCTION record_pick_view(p_pick_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO pick_views (pick_id, viewer_id)
  VALUES (p_pick_id, auth.uid());
END;
$$;

-- Create function to get trending picks
CREATE OR REPLACE FUNCTION get_trending_picks(p_days integer DEFAULT 7)
RETURNS TABLE (
  pick_id uuid,
  view_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT 
    pick_id,
    COUNT(*) as view_count
  FROM pick_views
  WHERE viewed_at >= NOW() - (p_days || ' days')::interval
  GROUP BY pick_id
  ORDER BY view_count DESC
  LIMIT 10;
$$;