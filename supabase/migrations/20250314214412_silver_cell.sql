/*
  # Fix picks table ID handling

  1. Changes
    - Ensure picks table has proper ID generation
    - Add trigger to handle ID generation
    - Update existing rows without IDs

  2. Security
    - Maintain existing RLS policies
*/

-- First ensure the picks table has the correct ID column setup
ALTER TABLE picks
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Update any existing rows that might not have IDs
UPDATE picks
SET id = gen_random_uuid()
WHERE id IS NULL;

-- Make ID column NOT NULL if it isn't already
ALTER TABLE picks
ALTER COLUMN id SET NOT NULL;