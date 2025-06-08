-- Add cover_image field to collections table
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS cover_image TEXT;
