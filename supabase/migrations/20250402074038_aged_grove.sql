/*
  # Clean up and create new users
  
  1. Changes
    - Remove existing data
    - Create new admin user (eunggyu.lee@gmail.com)
    - Create two creators and one member
    - Update profile information
    
  2. Security
    - Maintain existing RLS policies
    - Keep proper role assignments
*/

-- First, clean up existing data in correct order
DELETE FROM public.picks;
DELETE FROM public.profiles;
DELETE FROM auth.users;

-- Create admin user
DO $$ 
DECLARE
  admin_id uuid := gen_random_uuid();
BEGIN
  -- Insert admin user with explicit ID
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    confirmation_token,
    email_change_token_current,
    email_change_token_new,
    recovery_token,
    aud,
    confirmation_sent_at,
    invited_at,
    is_sso_user
  ) VALUES (
    admin_id,
    '00000000-0000-0000-0000-000000000000',
    'eunggyu.lee@gmail.com',
    crypt('admin123', gen_salt('bf')),
    now(),
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Eunggyu Lee"}'::jsonb,
    false,
    'authenticated',
    '',
    '',
    '',
    '',
    'authenticated',
    now(),
    now(),
    false
  );

  -- Update admin profile
  UPDATE public.profiles
  SET
    title = 'Lead Curator & Community Manager',
    status = 'approved',
    message = 'Passionate about discovering and sharing unique experiences, products, and stories.',
    social_links = '{
      "twitter": "https://twitter.com/eunggyulee",
      "linkedin": "https://linkedin.com/in/eunggyulee",
      "website": "https://eunggyulee.com"
    }'::jsonb,
    is_admin = true,
    is_creator = true
  WHERE id = admin_id;
END $$;

-- Create two creators
DO $$ 
DECLARE
  creator1_id uuid := gen_random_uuid();
  creator2_id uuid := gen_random_uuid();
BEGIN
  -- Insert creator 1
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
  ) VALUES (
    creator1_id,
    '00000000-0000-0000-0000-000000000000',
    'creator1@example.com',
    crypt('creator123', gen_salt('bf')),
    now(),
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Emma Davis"}'::jsonb,
    false,
    'authenticated'
  );

  -- Insert creator 2
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
  ) VALUES (
    creator2_id,
    '00000000-0000-0000-0000-000000000000',
    'creator2@example.com',
    crypt('creator123', gen_salt('bf')),
    now(),
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "David Kim"}'::jsonb,
    false,
    'authenticated'
  );

  -- Update creator profiles
  UPDATE public.profiles
  SET
    title = CASE 
      WHEN id = creator1_id THEN 'Food & Travel Curator'
      ELSE 'Design & Architecture Curator'
    END,
    status = 'approved',
    message = CASE 
      WHEN id = creator1_id THEN 'Exploring hidden culinary gems and sharing travel stories.'
      ELSE 'Discovering innovative design solutions and architectural wonders.'
    END,
    social_links = CASE 
      WHEN id = creator1_id THEN '{
        "instagram": "https://instagram.com/emmadaviscurates",
        "twitter": "https://twitter.com/emmadavistravel",
        "website": "https://emmadavis.co"
      }'::jsonb
      ELSE '{
        "instagram": "https://instagram.com/davidkimdesign",
        "linkedin": "https://linkedin.com/in/davidkimdesign",
        "website": "https://davidkim.design"
      }'::jsonb
    END,
    is_creator = true
  WHERE id IN (creator1_id, creator2_id);
END $$;

-- Create member
DO $$ 
DECLARE
  member_id uuid := gen_random_uuid();
BEGIN
  -- Insert member user
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
  ) VALUES (
    member_id,
    '00000000-0000-0000-0000-000000000000',
    'member@example.com',
    crypt('member123', gen_salt('bf')),
    now(),
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Michael Brown"}'::jsonb,
    false,
    'authenticated'
  );

  -- Update member profile
  UPDATE public.profiles
  SET
    title = 'Design Enthusiast',
    status = 'approved',
    message = 'Always on the lookout for beautiful design and inspiring stories.',
    social_links = '{
      "twitter": "https://twitter.com/michaelb",
      "linkedin": "https://linkedin.com/in/michaelbrown"
    }'::jsonb
  WHERE id = member_id;
END $$;