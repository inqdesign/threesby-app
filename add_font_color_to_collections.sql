-- Add font_color field to collections table
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS font_color TEXT;
