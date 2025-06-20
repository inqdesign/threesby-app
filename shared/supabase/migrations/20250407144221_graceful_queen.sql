/*
  # Create Featured Picks Table

  1. New Tables
    - `featured_picks`
      - `id` (uuid, primary key)
      - `category` (text) - Constrained to 'places', 'products', 'books'
      - `title` (text)
      - `description` (text)
      - `image_url` (text)
      - `reference` (text)
      - `visible` (boolean) - Default true
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `featured_picks` table
    - Add policies for:
      - Public users can view visible picks
      - Authenticated users can manage their own picks
      - Admins can manage all picks
*/

-- Create the featured_picks table
CREATE TABLE IF NOT EXISTS public.featured_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  image_url text NOT NULL,
  reference text NOT NULL,
  visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Add constraint to ensure category is one of the allowed values
  CONSTRAINT valid_category CHECK (category IN ('places', 'products', 'books'))
);

-- Enable Row Level Security
ALTER TABLE public.featured_picks ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Public users can view visible picks
CREATE POLICY "Public users can view visible picks"
  ON public.featured_picks
  FOR SELECT
  TO public
  USING (visible = true);

-- Authenticated users can manage their own picks
CREATE POLICY "Users can manage their own picks"
  ON public.featured_picks
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (is_creator = true OR is_admin = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (is_creator = true OR is_admin = true)
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS featured_picks_category_idx ON public.featured_picks (category);
CREATE INDEX IF NOT EXISTS featured_picks_visible_idx ON public.featured_picks (visible);
CREATE INDEX IF NOT EXISTS featured_picks_created_at_idx ON public.featured_picks (created_at);