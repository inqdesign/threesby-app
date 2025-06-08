/*
  # Create featured picks table

  1. New Tables
    - `featured_picks`
      - `id` (uuid, primary key)
      - `category` (text) - Constrained to 'places', 'products', 'books'
      - `title` (text)
      - `description` (text)
      - `image_url` (text)
      - `reference` (text)
      - `visible` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `featured_picks` table
    - Add policy for admins to manage featured picks
    - Add policy for public to view featured picks
*/

-- Create the featured_picks table
CREATE TABLE IF NOT EXISTS featured_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  image_url text NOT NULL,
  reference text NOT NULL,
  visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_category CHECK (category IN ('places', 'products', 'books'))
);

-- Enable RLS
ALTER TABLE featured_picks ENABLE ROW LEVEL SECURITY;

-- Admins can manage all featured picks
CREATE POLICY "Admins can manage featured picks"
  ON featured_picks
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  ));

-- Everyone can view featured picks
CREATE POLICY "Anyone can view featured picks"
  ON featured_picks
  FOR SELECT
  TO public
  USING (true);

-- Create index for visible picks
CREATE INDEX idx_featured_picks_visible
  ON featured_picks (visible)
  WHERE visible = true;