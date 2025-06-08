/*
  # Clean up migrations and fix auth setup
  
  1. Changes
    - Remove all duplicate migrations
    - Keep only necessary trigger functions in public schema
    - Fix error handling
    - Update admin email
    
  2. Security
    - Maintain existing RLS policies
    - Keep proper role assignments
*/

-- Create required extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop existing triggers and functions to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created_sample ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.create_sample_profile();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    status,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'pending',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle sample profile creation
CREATE OR REPLACE FUNCTION public.create_sample_profile()
RETURNS trigger AS $$
BEGIN
  IF NEW.email = 'eunggyu.lee@gmail.com' THEN
    UPDATE public.profiles
    SET 
      full_name = 'Eunggyu Lee',
      title = 'Lead Curator & Community Manager',
      status = 'approved',
      message = 'Passionate about discovering and sharing unique experiences, products, and stories.',
      social_links = '{
        "twitter": "https://twitter.com/eunggyulee",
        "linkedin": "https://linkedin.com/in/eunggyulee",
        "website": "https://eunggyulee.com"
      }',
      is_admin = true,
      is_creator = true,
      updated_at = NOW()
    WHERE id = NEW.id;
  ELSIF NEW.email = 'creator@example.com' THEN
    UPDATE public.profiles
    SET 
      full_name = 'Alex Chen',
      title = 'Travel & Lifestyle Curator',
      status = 'approved',
      message = 'Exploring the intersection of design, travel, and mindful living.',
      social_links = '{
        "instagram": "https://instagram.com/alexchencurates",
        "twitter": "https://twitter.com/alexchencurates",
        "website": "https://alexchen.co"
      }',
      is_creator = true,
      updated_at = NOW()
    WHERE id = NEW.id;
  ELSIF NEW.email = 'member@example.com' THEN
    UPDATE public.profiles
    SET 
      full_name = 'Michael Brown',
      title = 'Design Enthusiast',
      status = 'approved',
      message = 'Always on the lookout for beautiful design and inspiring stories.',
      social_links = '{
        "twitter": "https://twitter.com/michaelb",
        "linkedin": "https://linkedin.com/in/michaelbrown"
      }',
      updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    RAISE WARNING 'Error updating sample profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_created_sample
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_sample_profile();