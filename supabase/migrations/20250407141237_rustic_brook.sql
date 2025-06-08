/*
  # Create picks table and relationships
  
  1. New Tables
    - `picks` table for storing curator picks
      - id (uuid, primary key)
      - profile_id (uuid, references profiles)
      - category (text) - places, products, books
      - title (text)
      - description (text)
      - image_url (text)
      - reference (text)
      - status (text) - draft, pending_review, published, rejected
      - visible (boolean)
      - created_at (timestamp)
      - updated_at (timestamp)

  2. Security
    - Enable RLS
    - Add policies for public access and user management
*/

-- Create picks table
CREATE TABLE public.picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  category text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  image_url text NOT NULL,
  reference text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_category CHECK (category IN ('places', 'products', 'books')),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'pending_review', 'published', 'rejected'))
);

-- Create indexes for better performance
CREATE INDEX picks_profile_id_idx ON public.picks(profile_id);
CREATE INDEX picks_status_idx ON public.picks(status);
CREATE INDEX picks_category_idx ON public.picks(category);

-- Enable RLS
ALTER TABLE public.picks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public can view published picks"
ON public.picks
FOR SELECT
TO public
USING (status = 'published' AND visible = true);

CREATE POLICY "Users can manage own picks"
ON public.picks
FOR ALL
TO authenticated
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Admins can manage all picks"
ON public.picks
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);