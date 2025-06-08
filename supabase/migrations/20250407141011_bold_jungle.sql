-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop existing tables to start fresh
DROP TABLE IF EXISTS public.pick_views;
DROP TABLE IF EXISTS public.pick_revisions;
DROP TABLE IF EXISTS public.pick_tags;
DROP TABLE IF EXISTS public.tags;
DROP TABLE IF EXISTS public.comments;
DROP TABLE IF EXISTS public.saved_picks;
DROP TABLE IF EXISTS public.follows;
DROP TABLE IF EXISTS public.featured_picks;
DROP TABLE IF EXISTS public.picks;
DROP TABLE IF EXISTS public.curator_categories;
DROP TABLE IF EXISTS public.curator_applications;
DROP TABLE IF EXISTS public.profiles;

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  full_name text,
  title text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  message text,
  social_links jsonb DEFAULT '{}'::jsonb,
  is_admin boolean DEFAULT false,
  is_creator boolean DEFAULT false,
  invite_code text UNIQUE,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Create improved handle_new_user function with invite code support
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  invite_code text;
BEGIN
  -- Get invite code from metadata
  invite_code := NEW.raw_user_meta_data->>'invite_code';

  -- Check if invite code exists and is valid
  IF invite_code IS NOT NULL THEN
    -- Check if invite code exists
    IF NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE invite_code = invite_code 
      AND is_creator = true
    ) THEN
      RAISE EXCEPTION 'Invalid invite code';
    END IF;
  END IF;

  -- Create profile
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    status,
    created_at,
    updated_at,
    is_admin,
    is_creator,
    social_links,
    invite_code
  ) VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'pending',
    NOW(),
    NOW(),
    CASE 
      WHEN NEW.email = 'eunggyu.lee@gmail.com' THEN true
      ELSE false
    END,
    CASE 
      WHEN NEW.email = 'eunggyu.lee@gmail.com' THEN true
      WHEN invite_code IS NOT NULL THEN true
      ELSE false
    END,
    '{}'::jsonb,
    invite_code
  );

  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_status_idx ON public.profiles(status);
CREATE INDEX IF NOT EXISTS profiles_invite_code_idx ON public.profiles(invite_code);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view approved profiles"
  ON public.profiles
  FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Users can manage own profile"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can manage all profiles"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p2
      WHERE p2.id = auth.uid()
      AND p2.is_admin = true
      AND p2.id != profiles.id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p2
      WHERE p2.id = auth.uid()
      AND p2.is_admin = true
      AND p2.id != profiles.id
    )
  );