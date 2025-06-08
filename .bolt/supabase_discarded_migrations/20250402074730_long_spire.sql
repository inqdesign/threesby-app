/*
  # Fix Authentication Schema and User Creation

  1. Changes
    - Ensure auth schema is properly configured
    - Create users with proper auth schema fields
    - Fix profile creation trigger
    - Clean up existing data and recreate users

  2. Security
    - Maintain existing security policies
    - Ensure proper user authentication
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
  -- Insert admin user
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
    aud,
    confirmation_token,
    email_change_token_current,
    email_change_token_new,
    recovery_token,
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
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Eunggyu Lee"}'::jsonb,
    false,
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    '',
    now(),
    now(),
    false
  );

  -- Create admin profile
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    title,
    status,
    message,
    social_links,
    is_admin,
    is_creator,
    created_at,
    updated_at
  ) VALUES (
    admin_id,
    'eunggyu.lee@gmail.com',
    'Eunggyu Lee',
    'Lead Curator & Community Manager',
    'approved',
    'Passionate about discovering and sharing unique experiences, products, and stories.',
    '{
      "twitter": "https://twitter.com/eunggyulee",
      "linkedin": "https://linkedin.com/in/eunggyulee",
      "website": "https://eunggyulee.com"
    }'::jsonb,
    true,
    true,
    now(),
    now()
  );
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
    role,
    aud
  ) VALUES (
    creator1_id,
    '00000000-0000-0000-0000-000000000000',
    'creator1@example.com',
    crypt('creator123', gen_salt('bf')),
    now(),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Emma Davis"}'::jsonb,
    false,
    'authenticated',
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
    role,
    aud
  ) VALUES (
    creator2_id,
    '00000000-0000-0000-0000-000000000000',
    'creator2@example.com',
    crypt('creator123', gen_salt('bf')),
    now(),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"David Kim"}'::jsonb,
    false,
    'authenticated',
    'authenticated'
  );

  -- Create creator profiles
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    title,
    status,
    message,
    social_links,
    is_creator,
    created_at,
    updated_at
  ) VALUES 
  (
    creator1_id,
    'creator1@example.com',
    'Emma Davis',
    'Food & Travel Curator',
    'approved',
    'Exploring hidden culinary gems and sharing travel stories.',
    '{
      "instagram": "https://instagram.com/emmadaviscurates",
      "twitter": "https://twitter.com/emmadavistravel",
      "website": "https://emmadavis.co"
    }'::jsonb,
    true,
    now(),
    now()
  ),
  (
    creator2_id,
    'creator2@example.com',
    'David Kim',
    'Design & Architecture Curator',
    'approved',
    'Discovering innovative design solutions and architectural wonders.',
    '{
      "instagram": "https://instagram.com/davidkimdesign",
      "linkedin": "https://linkedin.com/in/davidkimdesign",
      "website": "https://davidkim.design"
    }'::jsonb,
    true,
    now(),
    now()
  );
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
    role,
    aud
  ) VALUES (
    member_id,
    '00000000-0000-0000-0000-000000000000',
    'member@example.com',
    crypt('member123', gen_salt('bf')),
    now(),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Michael Brown"}'::jsonb,
    false,
    'authenticated',
    'authenticated'
  );

  -- Create member profile
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    title,
    status,
    message,
    social_links,
    created_at,
    updated_at
  ) VALUES (
    member_id,
    'member@example.com',
    'Michael Brown',
    'Design Enthusiast',
    'approved',
    'Always on the lookout for beautiful design and inspiring stories.',
    '{
      "twitter": "https://twitter.com/michaelb",
      "linkedin": "https://linkedin.com/in/michaelbrown"
    }'::jsonb,
    now(),
    now()
  );
END $$;