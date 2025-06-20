/*
  # Storage configuration for picks

  1. Changes
    - Creates storage bucket for picks if it doesn't exist
    - Drops existing policies to avoid conflicts
    - Creates new policies for:
      - Public read access
      - Authenticated user uploads
      - User image deletion
*/

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('picks', 'picks', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Give public access to picks images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own images" ON storage.objects;

-- Allow public access to read files
CREATE POLICY "Give public access to picks images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'picks');

-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'picks' AND
  (LOWER(storage.extension(name)) = 'jpg' OR
   LOWER(storage.extension(name)) = 'jpeg' OR
   LOWER(storage.extension(name)) = 'png' OR
   LOWER(storage.extension(name)) = 'gif') AND
  COALESCE((metadata->>'size')::numeric, 0) < 1048576
);

-- Allow users to delete their own images
CREATE POLICY "Allow users to delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'picks' AND auth.uid()::text = (storage.foldername(name))[1]);