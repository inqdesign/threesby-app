-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Add invite_code column to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'invite_code'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN invite_code text UNIQUE,
    ADD COLUMN is_creator boolean DEFAULT false;
  END IF;
END $$;

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
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

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

-- Create indexes for better performance if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'profiles' AND indexname = 'profiles_invite_code_idx'
  ) THEN
    CREATE INDEX profiles_invite_code_idx ON public.profiles(invite_code);
  END IF;
END $$;

-- Update RLS policies
DROP POLICY IF EXISTS "Anyone can view approved profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

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

-- Create initial admin user if not exists
DO $$
DECLARE
  admin_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'eunggyu.lee@gmail.com'
  ) THEN
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      confirmed_at
    ) VALUES (
      gen_random_uuid(),
      'eunggyu.lee@gmail.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      '{"full_name": "Eunggyu Lee"}'::jsonb,
      now()
    )
    RETURNING id INTO admin_id;
  END IF;
END $$;