/*
  # Create Waitlist Table

  1. New Tables
    - `waitlist`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `created_at` (timestamptz)
      - `notified` (boolean) - whether they've been notified of availability

  2. Security
    - Enable RLS
    - Add policies for public access to insert emails
    - Add policies for admin access to manage waitlist
*/

-- Create waitlist table
CREATE TABLE IF NOT EXISTS public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  notified boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS waitlist_email_idx ON public.waitlist(email);
CREATE INDEX IF NOT EXISTS waitlist_created_at_idx ON public.waitlist(created_at);
CREATE INDEX IF NOT EXISTS waitlist_notified_idx ON public.waitlist(notified);

-- Create RLS policies
CREATE POLICY "Anyone can add email to waitlist"
ON public.waitlist
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Admins can manage waitlist"
ON public.waitlist
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