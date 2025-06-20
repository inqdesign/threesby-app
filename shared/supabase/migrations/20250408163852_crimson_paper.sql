/*
  # Add saved picks functionality

  1. New Tables
    - `saved_picks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `pick_id` (uuid, references picks)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create saved_picks table
CREATE TABLE IF NOT EXISTS public.saved_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  pick_id uuid REFERENCES public.picks(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, pick_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_picks_user ON public.saved_picks(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_picks_pick ON public.saved_picks(pick_id);

-- Enable RLS
ALTER TABLE public.saved_picks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their saved picks"
ON public.saved_picks
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read their saved picks"
ON public.saved_picks
FOR SELECT
TO authenticated
USING (user_id = auth.uid());