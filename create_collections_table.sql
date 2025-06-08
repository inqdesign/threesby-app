-- Create collections table
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    categories TEXT[] NOT NULL DEFAULT '{}',
    picks TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- Policy for selecting collections (anyone can view published collections)
CREATE POLICY "Anyone can view collections" 
ON public.collections 
FOR SELECT 
USING (true);

-- Policy for inserting collections (only authenticated users who are curators can create)
CREATE POLICY "Curators can create collections" 
ON public.collections 
FOR INSERT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.is_creator = true
    )
);

-- Policy for updating collections (only the owner can update)
CREATE POLICY "Users can update their own collections" 
ON public.collections 
FOR UPDATE 
TO authenticated 
USING (profile_id = auth.uid());

-- Policy for deleting collections (only the owner can delete)
CREATE POLICY "Users can delete their own collections" 
ON public.collections 
FOR DELETE 
TO authenticated 
USING (profile_id = auth.uid());

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS collections_profile_id_idx ON public.collections (profile_id);
CREATE INDEX IF NOT EXISTS collections_categories_idx ON public.collections USING GIN (categories);

-- Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically update updated_at
CREATE TRIGGER update_collections_updated_at
BEFORE UPDATE ON public.collections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add collections to public schema
GRANT ALL ON public.collections TO postgres;
GRANT ALL ON public.collections TO anon;
GRANT ALL ON public.collections TO authenticated;
GRANT ALL ON public.collections TO service_role;

-- Comment on table and columns for documentation
COMMENT ON TABLE public.collections IS 'Collections of picks created by curators';
COMMENT ON COLUMN public.collections.id IS 'Unique identifier for the collection';
COMMENT ON COLUMN public.collections.profile_id IS 'Foreign key to the profile that created the collection';
COMMENT ON COLUMN public.collections.title IS 'Title of the collection';
COMMENT ON COLUMN public.collections.description IS 'Description of the collection';
COMMENT ON COLUMN public.collections.categories IS 'Array of categories for the collection';
COMMENT ON COLUMN public.collections.picks IS 'Array of pick IDs included in the collection';
COMMENT ON COLUMN public.collections.created_at IS 'Timestamp when the collection was created';
COMMENT ON COLUMN public.collections.updated_at IS 'Timestamp when the collection was last updated';
