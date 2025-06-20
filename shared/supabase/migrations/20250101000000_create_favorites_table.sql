-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pick_id UUID NOT NULL REFERENCES picks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a user can only favorite a pick once
  UNIQUE(user_id, pick_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_pick_id ON favorites(pick_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at);

-- Enable Row Level Security
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own favorites
CREATE POLICY "Users can view their own favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own favorites
CREATE POLICY "Users can insert their own favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own favorites
CREATE POLICY "Users can delete their own favorites" ON favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update favorites count on picks table
CREATE OR REPLACE FUNCTION update_pick_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE picks 
    SET favorites_count = COALESCE(favorites_count, 0) + 1 
    WHERE id = NEW.pick_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE picks 
    SET favorites_count = GREATEST(COALESCE(favorites_count, 1) - 1, 0) 
    WHERE id = OLD.pick_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update favorites count
DROP TRIGGER IF EXISTS trigger_update_pick_favorites_count ON favorites;
CREATE TRIGGER trigger_update_pick_favorites_count
  AFTER INSERT OR DELETE ON favorites
  FOR EACH ROW EXECUTE FUNCTION update_pick_favorites_count();

-- Add favorites_count column to picks table if it doesn't exist
ALTER TABLE picks ADD COLUMN IF NOT EXISTS favorites_count INTEGER DEFAULT 0;

-- Initialize favorites_count for existing picks
UPDATE picks 
SET favorites_count = (
  SELECT COUNT(*) 
  FROM favorites 
  WHERE favorites.pick_id = picks.id
) 
WHERE favorites_count IS NULL OR favorites_count = 0; 