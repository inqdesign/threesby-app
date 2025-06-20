-- Drop existing tables and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.pick_views;
DROP TABLE IF EXISTS public.pick_revisions;
DROP TABLE IF EXISTS public.pick_tags;
DROP TABLE IF EXISTS public.tags;
DROP TABLE IF EXISTS public.comments;
DROP TABLE IF EXISTS public.saved_picks;
DROP TABLE IF EXISTS public.follows;
DROP TABLE IF EXISTS public.featured_picks;
DROP TABLE IF EXISTS public.picks;
DROP TABLE IF EXISTS public.profiles;

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
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

-- Create picks table
CREATE TABLE public.picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles ON DELETE CASCADE,
  category text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  image_url text NOT NULL,
  reference text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_category CHECK (category IN ('places', 'products', 'books')),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'pending_review', 'published', 'rejected'))
);

-- Create indexes
CREATE INDEX profiles_email_idx ON public.profiles(email);
CREATE INDEX profiles_status_idx ON public.profiles(status);
CREATE INDEX profiles_invite_code_idx ON public.profiles(invite_code);
CREATE INDEX picks_profile_id_idx ON public.picks(profile_id);
CREATE INDEX picks_status_idx ON public.picks(status);
CREATE INDEX picks_category_idx ON public.picks(category);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.picks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
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

-- Create RLS policies for picks
CREATE POLICY "Public can view published picks"
  ON public.picks
  FOR SELECT
  TO public
  USING (status = 'published' AND visible = true);

CREATE POLICY "Users can manage own picks"
  ON public.picks
  FOR ALL
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Admins can manage all picks"
  ON public.picks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  invite_code text;
BEGIN
  -- Get invite code from metadata
  invite_code := NEW.raw_user_meta_data->>'invite_code';

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
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create initial admin user
DO $$
BEGIN
  -- Check if admin user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'eunggyu.lee@gmail.com') THEN
    -- Insert admin user
    INSERT INTO auth.users (
      email,
      encrypted_password,
      raw_user_meta_data,
      role,
      aud,
      created_at,
      updated_at
    ) VALUES (
      'eunggyu.lee@gmail.com',
      crypt('admin123', gen_salt('bf')),
      '{"full_name": "Eunggyu Lee"}'::jsonb,
      'authenticated',
      'authenticated',
      now(),
      now()
    );
  END IF;
END $$;