-- Update profiles table status constraint
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS valid_status;

ALTER TABLE public.profiles
ADD CONSTRAINT valid_status CHECK (
  status IN ('pending', 'approved', 'rejected', 'draft', 'unpublished')
);