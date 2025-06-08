-- Update storage permissions for the profiles bucket to allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload to profiles bucket"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profiles');

-- Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated users to update their own files in profiles bucket"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to select from profiles bucket
CREATE POLICY "Allow authenticated users to select from profiles bucket"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'profiles');

-- Allow public to select from profiles bucket (for public profile images)
CREATE POLICY "Allow public to select from profiles bucket"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'profiles');
