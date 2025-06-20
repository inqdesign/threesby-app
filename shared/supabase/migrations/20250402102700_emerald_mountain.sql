/*
  # Fix Authentication Schema Issues

  1. Changes
    - Ensure auth schema exists
    - Create missing auth tables if needed
    - Add proper indexes for auth queries
    - Fix schema permissions

  2. Security
    - Maintain existing RLS policies
    - Keep proper role assignments
*/

-- Ensure auth schema exists
CREATE SCHEMA IF NOT EXISTS auth;

-- Ensure auth.users table has correct structure
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) THEN
    CREATE TABLE auth.users (
      id uuid NOT NULL PRIMARY KEY,
      instance_id uuid,
      email text,
      encrypted_password text,
      email_confirmed_at timestamp with time zone,
      invited_at timestamp with time zone,
      confirmation_token text,
      confirmation_sent_at timestamp with time zone,
      recovery_token text,
      recovery_sent_at timestamp with time zone,
      email_change_token_new text,
      email_change text,
      email_change_sent_at timestamp with time zone,
      last_sign_in_at timestamp with time zone,
      raw_app_meta_data jsonb,
      raw_user_meta_data jsonb,
      is_super_admin boolean,
      created_at timestamp with time zone,
      updated_at timestamp with time zone,
      phone text DEFAULT NULL::text,
      phone_confirmed_at timestamp with time zone,
      phone_change text DEFAULT ''::text,
      phone_change_token text DEFAULT ''::text,
      phone_change_sent_at timestamp with time zone,
      confirmed_at timestamp with time zone,
      email_change_token_current text DEFAULT ''::text,
      email_change_confirm_status smallint DEFAULT 0,
      banned_until timestamp with time zone,
      reauthentication_token text DEFAULT ''::text,
      reauthentication_sent_at timestamp with time zone,
      is_sso_user boolean DEFAULT false,
      deleted_at timestamp with time zone,
      CONSTRAINT users_email_key UNIQUE (email),
      CONSTRAINT users_phone_key UNIQUE (phone)
    );
  END IF;
END $$;

-- Create indexes for auth queries
CREATE INDEX IF NOT EXISTS users_instance_id_email_idx ON auth.users (instance_id, email);
CREATE INDEX IF NOT EXISTS users_instance_id_idx ON auth.users (instance_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO anon;

-- Ensure auth.users can be referenced by public.profiles
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey,
  ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;