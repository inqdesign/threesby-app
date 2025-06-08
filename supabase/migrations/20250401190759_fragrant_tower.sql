/*
  # Create Initial Users If Not Exist
  
  1. Changes
    - Create users only if they don't exist
    - Set proper auth metadata and status
    - Handle duplicate key constraints
*/

DO $$ 
BEGIN
  -- Create admin user if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@example.com') THEN
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
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'admin@example.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{"full_name": "Sarah Johnson"}'::jsonb,
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
  END IF;

  -- Create creator user if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'creator@example.com') THEN
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
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'creator@example.com',
      crypt('creator123', gen_salt('bf')),
      now(),
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{"full_name": "Alex Chen"}'::jsonb,
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
  END IF;

  -- Create regular member if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'member@example.com') THEN
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
      gen_random_uuid(),
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
  END IF;
END $$;