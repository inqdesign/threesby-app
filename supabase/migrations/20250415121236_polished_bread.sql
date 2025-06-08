/*
  # Consolidate Featured Picks into Picks Table

  1. Changes
    - Add is_featured flag to picks table
    - Migrate featured picks data with proper error handling
    - Update RLS policies to handle featured picks
    - Clean up old featured_picks table

  2. Security
    - Maintain existing RLS policies
    - Add proper constraints and indexes
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

-- Create temporary table for admin ID
CREATE TEMPORARY TABLE temp_admin_id AS
SELECT id FROM profiles WHERE is_admin = true ORDER BY created_at ASC LIMIT 1;

-- Migrate data from featured_picks to picks with better error handling
DO $$
DECLARE
  admin_id uuid;
BEGIN
  -- Get admin ID
  SELECT id INTO admin_id FROM temp_admin_id;
  
  -- If no admin exists, generate a placeholder UUID
  IF admin_id IS NULL THEN
    admin_id := gen_random_uuid();
  END IF;

  -- Migrate the data
  INSERT INTO public.picks (
    category,
    title,
    description,
    image_url,
    reference,
    status,
    visible,
    is_featured,
    created_at,
    updated_at,
    profile_id
  )
  SELECT
    fp.category,
    fp.title,
    fp.description,
    fp.image_url,
    fp.reference,
    'published' as status,
    COALESCE(fp.visible, true) as visible,
    true as is_featured,
    COALESCE(fp.created_at, now()) as created_at,
    COALESCE(fp.updated_at, now()) as updated_at,
    admin_id as profile_id
  FROM featured_picks fp
  WHERE NOT EXISTS (
    SELECT 1 FROM picks p
    WHERE p.title = fp.title
    AND p.description = fp.description
    AND p.image_url = fp.image_url
  );
END $$;

-- Drop temporary table
DROP TABLE temp_admin_id;

-- Drop featured_picks table only if migration was successful
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM picks WHERE is_featured = true
  ) THEN
    DROP TABLE IF EXISTS public.featured_picks;
  ELSE
    RAISE EXCEPTION 'Migration failed - no featured picks were transferred';
  END IF;
END $$;

-- Update RLS policies
DROP POLICY IF EXISTS "Enable read access for picks" ON picks;
DROP POLICY IF EXISTS "Enable authenticated user access for picks" ON picks;
DROP POLICY IF EXISTS "Enable public read access for picks" ON picks;
DROP POLICY IF EXISTS "Public can view published picks" ON picks;
DROP POLICY IF EXISTS "Users can manage own picks" ON picks;
DROP POLICY IF EXISTS "Admins can manage all picks" ON picks;

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