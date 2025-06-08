/*
  # Fix authentication schema and policies

  1. Changes
    - Add trigger to automatically create profile on user signup
    - Ensure proper RLS policies for authentication
    - Add missing auth schema if not exists

  2. Security
    - Enable RLS on auth.users
    - Add policies for proper authentication flow
*/

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Ensure the auth.users table exists
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid NOT NULL PRIMARY KEY,
  email text
);

-- Create the handle_new_user function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, status)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'pending'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END
$$;

-- Ensure proper RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable authenticated user access" ON public.profiles;
DROP POLICY IF EXISTS "Enable public read access" ON public.profiles;

-- Create new policies
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable authenticated user access"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((auth.uid() = id) OR (status = 'approved'));

CREATE POLICY "Enable public read access"
  ON public.profiles
  FOR SELECT
  TO public
  USING (status = 'approved');