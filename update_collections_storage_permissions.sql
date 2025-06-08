-- Update storage permissions for the collections bucket to allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload to collections bucket"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'picks' AND (storage.foldername(name))[1] = 'collections');

-- Allow authenticated users to update their own files in collections
CREATE POLICY "Allow authenticated users to update their own collection files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'picks' AND 
  (storage.foldername(name))[1] = 'collections' AND 
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Allow authenticated users to select from collections
CREATE POLICY "Allow authenticated users to select from collections"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'picks' AND (storage.foldername(name))[1] = 'collections');

-- Allow public to select from collections (for public collection images)
CREATE POLICY "Allow public to select from collections"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'picks' AND (storage.foldername(name))[1] = 'collections');
