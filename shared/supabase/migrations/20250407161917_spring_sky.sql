/*
  # Fix Storage Policies for Picks Bucket

  1. Changes
    - Create storage bucket for picks if it doesn't exist
    - Set up proper storage policies for image uploads
    - Allow public access to read images
    - Fix RLS policy violations

  2. Security
    - Maintain proper access control
    - Enable authenticated users to upload images
    - Allow public read access
*/

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('picks', 'picks', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

-- Allow authenticated users to upload images
CREATE POLICY "Users can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'picks' AND
  (auth.role() = 'authenticated' OR auth.role() = 'service_role')
);

-- Allow public access to read images
CREATE POLICY "Public can read images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'picks');

-- Allow authenticated users to update their own images
CREATE POLICY "Users can update own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'picks' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'picks' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'picks' AND auth.uid()::text = (storage.foldername(name))[1]);