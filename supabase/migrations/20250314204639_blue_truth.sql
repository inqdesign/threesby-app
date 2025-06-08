/*
  # Set admin user

  1. Changes
    - Sets the specified user as an admin
*/

-- Set the specified user as an admin
UPDATE profiles
SET is_admin = true
WHERE email = 'your-email@example.com';