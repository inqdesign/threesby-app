-- Add last_updated_at column to picks table if it doesn't exist
ALTER TABLE public.picks
ADD COLUMN IF NOT EXISTS last_updated_at timestamptz;

-- Update existing picks to set last_updated_at
UPDATE public.picks
SET last_updated_at = updated_at
WHERE last_updated_at IS NULL;