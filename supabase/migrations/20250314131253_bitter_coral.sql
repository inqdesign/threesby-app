/*
  # Initial Schema Setup

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, linked to auth.users)
      - `email` (text)
      - `full_name` (text)
      - `status` (text) - pending, approved, rejected
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `picks`
      - `id` (uuid, primary key)
      - `profile_id` (uuid, foreign key to profiles)
      - `category` (text) - places, products, books
      - `title` (text)
      - `description` (text)
      - `image_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `status` (text) - draft, pending_review, published, rejected

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Add policies for admin users
*/

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL,
  full_name text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Create picks table
CREATE TABLE picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  category text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'draft',
  CONSTRAINT valid_category CHECK (category IN ('places', 'products', 'books')),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'pending_review', 'published', 'rejected'))
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Picks policies
CREATE POLICY "Users can read published picks"
  ON picks
  FOR SELECT
  TO authenticated
  USING (status = 'published');

CREATE POLICY "Users can read their own picks"
  ON picks
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can create their own picks"
  ON picks
  FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own draft picks"
  ON picks
  FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid() AND status = 'draft');

-- Create function to handle profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, status)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'pending');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();