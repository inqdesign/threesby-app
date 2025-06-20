/*
  # Add Chat System Tables

  1. New Tables
    - `chat_messages` for storing conversation history
    - `chat_sessions` for managing chat contexts
    - `chat_outputs` for storing generated content

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  category text NOT NULL,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_category CHECK (category IN ('places', 'products', 'books')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'completed', 'abandoned'))
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_role CHECK (role IN ('system', 'user', 'assistant'))
);

-- Create chat_outputs table
CREATE TABLE IF NOT EXISTS public.chat_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  pick_id uuid REFERENCES public.picks(id) ON DELETE SET NULL,
  category text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  reference text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_category CHECK (category IN ('places', 'products', 'books'))
);

-- Enable RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_outputs ENABLE ROW LEVEL SECURITY;

-- Create policies for chat_sessions
CREATE POLICY "Users can manage their chat sessions"
ON public.chat_sessions
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create policies for chat_messages
CREATE POLICY "Users can manage their chat messages"
ON public.chat_messages
FOR ALL
TO authenticated
USING (
  session_id IN (
    SELECT id FROM public.chat_sessions WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  session_id IN (
    SELECT id FROM public.chat_sessions WHERE user_id = auth.uid()
  )
);

-- Create policies for chat_outputs
CREATE POLICY "Users can manage their chat outputs"
ON public.chat_outputs
FOR ALL
TO authenticated
USING (
  session_id IN (
    SELECT id FROM public.chat_sessions WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  session_id IN (
    SELECT id FROM public.chat_sessions WHERE user_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX idx_chat_outputs_session_id ON public.chat_outputs(session_id);