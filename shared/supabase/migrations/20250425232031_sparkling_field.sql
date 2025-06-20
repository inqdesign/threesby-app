/*
  # Add Submission Reviews System

  1. New Tables
    - `submission_reviews`
      - `id` (uuid, primary key)
      - `profile_id` (uuid, references profiles)
      - `status` (text) - pending, approved, rejected
      - `rejection_note` (text)
      - `reviewed_by` (uuid, references profiles)
      - `reviewed_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for admin access
    - Add policies for user access to own submissions
*/

-- Create submission_reviews table
CREATE TABLE IF NOT EXISTS public.submission_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  rejection_note text,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected', 'canceled'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_submission_reviews_profile_id ON public.submission_reviews(profile_id);
CREATE INDEX IF NOT EXISTS idx_submission_reviews_status ON public.submission_reviews(status);
CREATE INDEX IF NOT EXISTS idx_submission_reviews_reviewed_by ON public.submission_reviews(reviewed_by);

-- Enable RLS
ALTER TABLE public.submission_reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own submissions"
ON public.submission_reviews
FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "Admins can manage all submissions"
ON public.submission_reviews
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

-- Add last_submitted_at column to profiles if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_submitted_at timestamptz,
ADD COLUMN IF NOT EXISTS rejection_note text;