-- Add issue_number column to collections table
ALTER TABLE public.collections 
ADD COLUMN IF NOT EXISTS issue_number INTEGER;

-- Create index for efficient searching by issue number
CREATE INDEX IF NOT EXISTS collections_issue_number_idx ON public.collections (issue_number);

-- Create index for efficient querying by profile and issue number
CREATE INDEX IF NOT EXISTS collections_profile_issue_idx ON public.collections (profile_id, issue_number);

-- Add comment for documentation
COMMENT ON COLUMN public.collections.issue_number IS 'Sequential issue number for collections by the same curator (starting from 1)';

-- Function to automatically set issue number for new collections
CREATE OR REPLACE FUNCTION public.set_collection_issue_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set issue_number if it's not already provided
    IF NEW.issue_number IS NULL THEN
        -- Get the next issue number for this curator
        SELECT COALESCE(MAX(issue_number), 0) + 1
        INTO NEW.issue_number
        FROM public.collections
        WHERE profile_id = NEW.profile_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set issue number on insert
DROP TRIGGER IF EXISTS set_collection_issue_number_trigger ON public.collections;
CREATE TRIGGER set_collection_issue_number_trigger
    BEFORE INSERT ON public.collections
    FOR EACH ROW
    EXECUTE FUNCTION public.set_collection_issue_number();

-- Update existing collections to have issue numbers (ordered by creation date)
WITH numbered_collections AS (
    SELECT 
        id,
        profile_id,
        ROW_NUMBER() OVER (PARTITION BY profile_id ORDER BY created_at) as issue_num
    FROM public.collections
    WHERE issue_number IS NULL
)
UPDATE public.collections
SET issue_number = numbered_collections.issue_num
FROM numbered_collections
WHERE public.collections.id = numbered_collections.id; 