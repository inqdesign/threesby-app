-- Add is_featured column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_featured ON public.profiles(is_featured) WHERE is_featured = true;

-- Update RLS policies to allow reading featured status
CREATE POLICY "Anyone can read featured status"
ON public.profiles
FOR SELECT
USING (true);