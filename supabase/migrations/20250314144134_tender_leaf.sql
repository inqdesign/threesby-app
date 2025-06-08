/*
  # Create storage bucket for picks

  1. Storage
    - Create 'picks' bucket for storing user-uploaded images
    - Enable public access for reading images
    - Set up security policies for uploads
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('picks', 'picks', true);

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload files to their own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'picks' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'picks' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'picks' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public access to read files
CREATE POLICY "Public can read all files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'picks');