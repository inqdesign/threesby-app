/*
  # Create Test Users

  1. Changes
    - Add test users with known credentials
    - Set appropriate roles and status
*/

-- Create admin user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  'admin@example.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  '{"full_name": "Sarah Johnson"}'::jsonb
);

-- Create creator user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  'creator@example.com',
  crypt('creator123', gen_salt('bf')),
  now(),
  '{"full_name": "Alex Chen"}'::jsonb
);

-- Create regular member
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  'member@example.com',
  crypt('member123', gen_salt('bf')),
  now(),
  '{"full_name": "Michael Brown"}'::jsonb
);