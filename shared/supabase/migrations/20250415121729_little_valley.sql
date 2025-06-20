/*
  # Consolidate Featured Picks into Picks Table

  1. Changes
    - Add is_featured flag to picks table
    - Drop existing policies to avoid conflicts
    - Create new policies for featured picks
    - Add sample featured picks

  2. Security
    - Maintain proper RLS policies
    - Add constraints and indexes
*/

-- Add is_featured column to picks table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'picks' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE public.picks
    ADD COLUMN is_featured boolean DEFAULT false;
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_picks_is_featured ON public.picks(is_featured) WHERE is_featured = true;

-- Drop all existing policies to avoid conflicts
DO $$
BEGIN
  DROP POLICY IF EXISTS "Enable read access for picks" ON picks;
  DROP POLICY IF EXISTS "Enable authenticated user access for picks" ON picks;
  DROP POLICY IF EXISTS "Enable public read access for picks" ON picks;
  DROP POLICY IF EXISTS "Public can view published picks" ON picks;
  DROP POLICY IF EXISTS "Users can manage own picks" ON picks;
  DROP POLICY IF EXISTS "Admins can manage all picks" ON picks;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create new policies that handle featured picks
CREATE POLICY "Enable public read access for picks"
ON picks
FOR SELECT
USING (
  (status = 'published' AND visible = true) OR
  (auth.uid() IS NOT NULL AND profile_id = auth.uid()) OR
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  ))
);

CREATE POLICY "Enable authenticated user access for picks"
ON picks
FOR ALL
TO authenticated
USING (
  profile_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  )
)
WITH CHECK (
  profile_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  )
);

-- Add sample featured picks if none exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM picks WHERE is_featured = true) THEN
    INSERT INTO picks (
      category,
      title,
      description,
      image_url,
      reference,
      status,
      visible,
      is_featured,
      profile_id
    )
    SELECT
      category,
      title,
      description,
      image_url,
      reference,
      'published',
      true,
      true,
      (SELECT id FROM profiles WHERE is_admin = true LIMIT 1)
    FROM (
      VALUES
        (
          'places',
          'Hidden Garden Café',
          'A serene oasis in the heart of the city. This café combines lush greenery with exceptional coffee and fresh, seasonal dishes. The courtyard seating is particularly magical during spring.',
          'https://images.unsplash.com/photo-1554118811-1e0d58224f24',
          'Downtown Botanical District'
        ),
        (
          'products',
          'Minimal Desk Setup',
          'A carefully curated collection of desk essentials that enhance focus and creativity. The perfect balance of form and function for productive work.',
          'https://images.unsplash.com/photo-1593062096033-9a26b09da705',
          'Modern Office'
        ),
        (
          'books',
          'The Art of Slow Living',
          'A thoughtful exploration of mindful living in our fast-paced world. Practical insights for creating meaningful daily rituals and finding joy in simplicity.',
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c',
          'Emma Davis'
        )
    ) AS sample_picks(category, title, description, image_url, reference);
  END IF;
END $$;