-- Create site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allow_signups BOOLEAN DEFAULT TRUE,
  require_invite_code BOOLEAN DEFAULT TRUE,
  auto_approve_submissions BOOLEAN DEFAULT FALSE,
  maintenance_mode BOOLEAN DEFAULT FALSE,
  featured_profile_ids UUID[] DEFAULT '{}',
  site_announcement TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set RLS policies
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Only allow admins to read site settings
CREATE POLICY "Allow admins to read site settings" 
  ON public.site_settings
  FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT auth.uid() FROM public.profiles 
      WHERE is_admin = true
    )
  );

-- Only allow admins to insert site settings
CREATE POLICY "Allow admins to insert site settings" 
  ON public.site_settings
  FOR INSERT 
  WITH CHECK (
    auth.uid() IN (
      SELECT auth.uid() FROM public.profiles 
      WHERE is_admin = true
    )
  );

-- Only allow admins to update site settings
CREATE POLICY "Allow admins to update site settings" 
  ON public.site_settings
  FOR UPDATE 
  USING (
    auth.uid() IN (
      SELECT auth.uid() FROM public.profiles 
      WHERE is_admin = true
    )
  );

-- Only allow admins to delete site settings
CREATE POLICY "Allow admins to delete site settings" 
  ON public.site_settings
  FOR DELETE 
  USING (
    auth.uid() IN (
      SELECT auth.uid() FROM public.profiles 
      WHERE is_admin = true
    )
  );
