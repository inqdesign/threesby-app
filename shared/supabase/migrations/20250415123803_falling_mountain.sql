/*
  # Add brand type to profiles
  
  1. Changes
    - Add is_brand boolean column to profiles table
    - Add index for brand profiles
    - Update existing RLS policies
*/

-- Add is_brand column if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_brand boolean DEFAULT false;

-- Create index for brand profiles
CREATE INDEX IF NOT EXISTS idx_profiles_is_brand 
ON public.profiles(is_brand) 
WHERE is_brand = true;