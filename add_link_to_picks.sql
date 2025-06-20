-- Add link column to picks table
ALTER TABLE public.picks ADD COLUMN IF NOT EXISTS link text;

-- Add a comment to describe the column
COMMENT ON COLUMN public.picks.link IS 'Optional URL link to product/brand/place/book that curators can add to their picks'; 