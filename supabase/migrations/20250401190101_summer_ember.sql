/*
  # Approve All Curators

  1. Changes
    - Set all curator profiles to 'approved' status
    - Ensure their picks are published and visible
*/

-- Approve all curator profiles
UPDATE profiles
SET 
  status = 'approved',
  updated_at = NOW()
WHERE 
  email IN (
    'creator1@example.com',  -- Emma Davis
    'creator2@example.com',  -- David Kim
    'creator3@example.com',  -- Sofia Martinez
    'creator4@example.com',  -- James Wilson
    'creator5@example.com'   -- Olivia Thompson
  );

-- Ensure all their picks are published and visible
UPDATE picks
SET 
  status = 'published',
  visible = true,
  updated_at = NOW()
WHERE 
  profile_id IN (
    SELECT id FROM profiles
    WHERE email IN (
      'creator1@example.com',
      'creator2@example.com',
      'creator3@example.com',
      'creator4@example.com',
      'creator5@example.com'
    )
  );