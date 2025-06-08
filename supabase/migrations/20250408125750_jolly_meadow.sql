-- Drop existing policies
DROP POLICY IF EXISTS "Public can view published picks" ON picks;
DROP POLICY IF EXISTS "Users can manage own picks" ON picks;
DROP POLICY IF EXISTS "Admins can manage all picks" ON picks;

-- Create simplified RLS policies
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

-- Add sample data for testing
INSERT INTO picks (
  profile_id,
  category,
  title,
  description,
  image_url,
  reference,
  status,
  visible
)
SELECT 
  profiles.id,
  'places',
  'Sample Place',
  'A beautiful sample location',
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24',
  'Sample Reference',
  'published',
  true
FROM profiles
WHERE email = 'eunggyu.lee@gmail.com'
LIMIT 1;