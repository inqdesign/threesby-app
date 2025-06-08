/*
  # Update Featured Picks Schema and Functionality

  1. Changes
    - Create new featured_picks table
    - Add trigger to enforce 3-pick limit
    - Migrate existing featured picks
    - Add RLS policies

  2. Security
    - Only admins can manage featured picks
    - Public can read featured picks
    - Enforce 3-pick limit via trigger
*/

-- Create new featured_picks table
CREATE TABLE IF NOT EXISTS featured_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  image_url text NOT NULL,
  reference text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  visible boolean DEFAULT true,
  CONSTRAINT valid_category CHECK (category IN ('places', 'products', 'books'))
);

-- Create function to enforce max visible picks
CREATE OR REPLACE FUNCTION check_max_visible_picks()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR NEW.visible != OLD.visible) AND NEW.visible = true THEN
    IF (
      SELECT COUNT(*)
      FROM featured_picks
      WHERE visible = true AND id != NEW.id
    ) >= 3 THEN
      RAISE EXCEPTION 'Maximum of 3 visible featured picks allowed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce max visible picks
DROP TRIGGER IF EXISTS enforce_max_visible_picks ON featured_picks;
CREATE TRIGGER enforce_max_visible_picks
  BEFORE INSERT OR UPDATE ON featured_picks
  FOR EACH ROW
  EXECUTE FUNCTION check_max_visible_picks();

-- Enable RLS
ALTER TABLE featured_picks ENABLE ROW LEVEL SECURITY;

-- Only admins can manage featured picks
CREATE POLICY "Admins can manage featured picks"
ON featured_picks
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Anyone can read featured picks
CREATE POLICY "Anyone can read featured picks"
ON featured_picks
FOR SELECT
USING (visible = true);

-- Migrate existing featured picks
INSERT INTO featured_picks (
  category,
  title,
  description,
  image_url,
  reference,
  created_at,
  updated_at,
  visible
)
SELECT
  category,
  title,
  description,
  image_url,
  reference,
  created_at,
  updated_at,
  visible
FROM picks
WHERE profile_id IS NULL
AND status = 'published'
ORDER BY created_at ASC
LIMIT 3;

-- Remove old featured picks
DELETE FROM picks WHERE profile_id IS NULL;