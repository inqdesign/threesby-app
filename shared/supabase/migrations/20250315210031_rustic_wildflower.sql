/*
  # Add Sample Content

  1. Changes
    - Add featured picks without user association
    - Add sample content that doesn't require auth.users entries
    - Maintain data consistency and relationships

  2. Security
    - Maintain RLS policies
    - Keep existing functionality
*/

-- Add featured picks (no user association needed)
INSERT INTO picks (
  id,
  profile_id,  -- null for featured picks
  category,
  title,
  description,
  image_url,
  reference,
  status,
  visible
) VALUES
  -- Places
  (
    gen_random_uuid(),
    NULL,
    'places',
    'Hidden Garden Café',
    'A serene oasis in the heart of the city. This café combines lush greenery with exceptional coffee and fresh, seasonal dishes. The courtyard seating is particularly magical during spring.',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24',
    'Downtown Botanical District',
    'published',
    true
  ),
  (
    gen_random_uuid(),
    NULL,
    'places',
    'Sunset Cliffs Lookout',
    'The perfect spot to watch the sun dip below the horizon. Arrive an hour before sunset to secure a good viewing spot and bring a blanket for comfort.',
    'https://images.unsplash.com/photo-1503803548695-c2a7b4a5b875',
    'Coastal Park',
    'published',
    true
  ),
  (
    gen_random_uuid(),
    NULL,
    'places',
    'Mountain Echo Trail',
    'A moderate 3-mile hike that rewards you with panoramic valley views. Best visited during early morning when the mist still clings to the mountains.',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b',
    'National Forest',
    'published',
    true
  );

-- Create function to add sample data after user creation
CREATE OR REPLACE FUNCTION create_sample_profile()
RETURNS trigger AS $$
BEGIN
  -- Check if this is one of our sample email addresses
  IF NEW.email = 'admin@example.com' THEN
    UPDATE profiles
    SET 
      full_name = 'Sarah Johnson',
      title = 'Lead Curator & Community Manager',
      status = 'approved',
      message = 'Passionate about discovering and sharing unique experiences, products, and stories.',
      social_links = '{
        "twitter": "https://twitter.com/sarahjcurator",
        "linkedin": "https://linkedin.com/in/sarahjcurator",
        "website": "https://sarahjohnson.com"
      }',
      is_admin = true,
      is_creator = true
    WHERE id = NEW.id;
  ELSIF NEW.email = 'creator@example.com' THEN
    UPDATE profiles
    SET 
      full_name = 'Alex Chen',
      title = 'Travel & Lifestyle Curator',
      status = 'approved',
      message = 'Exploring the intersection of design, travel, and mindful living.',
      social_links = '{
        "instagram": "https://instagram.com/alexchencurates",
        "twitter": "https://twitter.com/alexchencurates",
        "website": "https://alexchen.co"
      }',
      is_creator = true
    WHERE id = NEW.id;
  ELSIF NEW.email = 'member@example.com' THEN
    UPDATE profiles
    SET 
      full_name = 'Michael Brown',
      title = 'Design Enthusiast',
      status = 'approved',
      message = 'Always on the lookout for beautiful design and inspiring stories.',
      social_links = '{
        "twitter": "https://twitter.com/michaelb",
        "linkedin": "https://linkedin.com/in/michaelbrown"
      }'
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for sample data
DROP TRIGGER IF EXISTS on_auth_user_created_sample ON auth.users;
CREATE TRIGGER on_auth_user_created_sample
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_sample_profile();