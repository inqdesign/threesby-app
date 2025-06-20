-- Add username column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);

-- Create function to check username availability
CREATE OR REPLACE FUNCTION public.check_username_availability(username_param text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE LOWER(username) = LOWER(username_param)
  );
$$;

-- Create function to generate username suggestions
CREATE OR REPLACE FUNCTION public.generate_username_suggestions(base_name text)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  suggestions text[] := '{}';
  base_clean text;
  i int := 1;
  suggestion text;
BEGIN
  -- Clean the base name (remove spaces, special chars, convert to lowercase)
  base_clean := LOWER(REGEXP_REPLACE(base_name, '[^a-zA-Z0-9]', '', 'g'));
  
  -- Limit base name length
  IF LENGTH(base_clean) > 15 THEN
    base_clean := LEFT(base_clean, 15);
  END IF;
  
  -- Add original if available
  IF public.check_username_availability(base_clean) THEN
    suggestions := array_append(suggestions, base_clean);
  END IF;
  
  -- Add numbered suggestions
  WHILE array_length(suggestions, 1) < 5 AND i <= 999 LOOP
    suggestion := base_clean || i::text;
    IF public.check_username_availability(suggestion) THEN
      suggestions := array_append(suggestions, suggestion);
    END IF;
    i := i + 1;
  END LOOP;
  
  RETURN suggestions;
END;
$$;

-- Add constraint to ensure username format
ALTER TABLE public.profiles
ADD CONSTRAINT username_format_check 
CHECK (username IS NULL OR (
  username ~ '^[a-zA-Z0-9][a-zA-Z0-9_.-]*[a-zA-Z0-9]$' AND
  LENGTH(username) >= 3 AND
  LENGTH(username) <= 20
));

-- Comment on the username column
COMMENT ON COLUMN public.profiles.username IS 'Unique username for profile URLs (3-20 chars, alphanumeric with . _ -)';
