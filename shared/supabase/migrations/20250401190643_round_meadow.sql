/*
  # Update Existing Profiles
  
  1. Changes
    - Update existing profiles with new data
    - Set proper roles and permissions
    - Maintain existing relationships
*/

-- Update admin profile
UPDATE public.profiles
SET
  title = 'Lead Curator & Community Manager',
  status = 'approved',
  message = 'Passionate about discovering and sharing unique experiences, products, and stories.',
  social_links = '{
    "twitter": "https://twitter.com/sarahjcurator",
    "linkedin": "https://linkedin.com/in/sarahjcurator",
    "website": "https://sarahjohnson.com"
  }'::jsonb,
  is_admin = true,
  is_creator = true,
  updated_at = NOW()
WHERE email = 'admin@example.com';

-- Update creator profile
UPDATE public.profiles
SET
  title = 'Travel & Lifestyle Curator',
  status = 'approved',
  message = 'Exploring the intersection of design, travel, and mindful living.',
  social_links = '{
    "instagram": "https://instagram.com/alexchencurates",
    "twitter": "https://twitter.com/alexchencurates",
    "website": "https://alexchen.co"
  }'::jsonb,
  is_creator = true,
  updated_at = NOW()
WHERE email = 'creator@example.com';

-- Update member profile
UPDATE public.profiles
SET
  title = 'Design Enthusiast',
  status = 'approved',
  message = 'Always on the lookout for beautiful design and inspiring stories.',
  social_links = '{
    "twitter": "https://twitter.com/michaelb",
    "linkedin": "https://linkedin.com/in/michaelbrown"
  }'::jsonb,
  updated_at = NOW()
WHERE email = 'member@example.com';