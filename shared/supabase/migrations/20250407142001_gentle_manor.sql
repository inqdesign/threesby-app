-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  invite_code text;
BEGIN
  -- Get invite code from metadata if it exists
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
      ELSE false
    END,
    '{}'::jsonb,
    invite_code
  );

  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies
DROP POLICY IF EXISTS "Anyone can view approved profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Create simplified RLS policies
CREATE POLICY "Enable public read access"
  ON public.profiles
  FOR SELECT
  USING (status = 'approved' OR id = auth.uid());

CREATE POLICY "Enable authenticated user access"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles p2
      WHERE p2.id = auth.uid()
      AND p2.is_admin = true
      AND p2.id != profiles.id
    )
  )
  WITH CHECK (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles p2
      WHERE p2.id = auth.uid()
      AND p2.is_admin = true
      AND p2.id != profiles.id
    )
  );