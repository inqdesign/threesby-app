/*
  # Add rank column to picks table
  
  1. Changes
    - Add rank column to picks table
    - Set default rank to 0 (archived)
    - Update existing picks to have sequential ranks
*/

-- Add rank column if it doesn't exist
ALTER TABLE public.picks
ADD COLUMN IF NOT EXISTS rank integer DEFAULT 0;

-- Update existing picks to have sequential ranks within their categories
WITH ranked_picks AS (
  SELECT 
    id,
    category,
    profile_id,
    ROW_NUMBER() OVER (
      PARTITION BY profile_id, category 
      ORDER BY created_at ASC
    ) as new_rank
  FROM picks
  WHERE visible = true
)
UPDATE picks p
SET rank = CASE 
  WHEN rp.new_rank <= 3 THEN rp.new_rank 
  ELSE 0
END
FROM ranked_picks rp
WHERE p.id = rp.id;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_picks_rank ON public.picks(rank);