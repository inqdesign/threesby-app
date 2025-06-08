-- Create favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pick_id UUID NOT NULL REFERENCES public.picks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(user_id, pick_id)
);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Policy for selecting favorites (users can view their own favorites)
CREATE POLICY "Users can view their own favorites" 
ON public.favorites 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- Policy for inserting favorites (authenticated users can create)
CREATE POLICY "Users can create favorites" 
ON public.favorites 
FOR INSERT 
TO authenticated 
USING (user_id = auth.uid());

-- Policy for deleting favorites (users can delete their own favorites)
CREATE POLICY "Users can delete their own favorites" 
ON public.favorites 
FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON public.favorites (user_id);
CREATE INDEX IF NOT EXISTS favorites_pick_id_idx ON public.favorites (pick_id);

-- Add a favorites_count column to picks table
ALTER TABLE public.picks ADD COLUMN IF NOT EXISTS favorites_count INTEGER DEFAULT 0;

-- Create function to update favorites_count
CREATE OR REPLACE FUNCTION update_favorites_count() 
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.picks
    SET favorites_count = favorites_count + 1
    WHERE id = NEW.pick_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.picks
    SET favorites_count = GREATEST(favorites_count - 1, 0)
    WHERE id = OLD.pick_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for favorites_count
CREATE TRIGGER favorites_count_trigger
AFTER INSERT OR DELETE ON public.favorites
FOR EACH ROW
EXECUTE FUNCTION update_favorites_count();
