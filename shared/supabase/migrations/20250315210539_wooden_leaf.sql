/*
  # Add More Creators and Their Content

  1. Changes
    - Add more sample creator profiles via trigger function
    - Each creator will get their own set of picks
    - Maintain data consistency and relationships

  2. Security
    - Maintain RLS policies
    - Keep existing functionality
*/

-- Update the create_sample_profile function to include more creators
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
  ELSIF NEW.email = 'creator1@example.com' THEN
    UPDATE profiles
    SET 
      full_name = 'Emma Davis',
      title = 'Food & Travel Curator',
      status = 'approved',
      message = 'Exploring hidden culinary gems and sharing travel stories from around the world.',
      social_links = '{
        "instagram": "https://instagram.com/emmadaviscurates",
        "twitter": "https://twitter.com/emmadavistravel",
        "website": "https://emmadavis.co"
      }',
      is_creator = true
    WHERE id = NEW.id;
  ELSIF NEW.email = 'creator2@example.com' THEN
    UPDATE profiles
    SET 
      full_name = 'David Kim',
      title = 'Design & Architecture Curator',
      status = 'approved',
      message = 'Discovering innovative design solutions and architectural wonders.',
      social_links = '{
        "instagram": "https://instagram.com/davidkimdesign",
        "linkedin": "https://linkedin.com/in/davidkimdesign",
        "website": "https://davidkim.design"
      }',
      is_creator = true
    WHERE id = NEW.id;
  ELSIF NEW.email = 'creator3@example.com' THEN
    UPDATE profiles
    SET 
      full_name = 'Sofia Martinez',
      title = 'Lifestyle & Wellness Curator',
      status = 'approved',
      message = 'Sharing mindful living tips and sustainable lifestyle choices.',
      social_links = '{
        "instagram": "https://instagram.com/sofiamwellness",
        "twitter": "https://twitter.com/sofiamartinez",
        "website": "https://sofiamartinez.life"
      }',
      is_creator = true
    WHERE id = NEW.id;
  ELSIF NEW.email = 'creator4@example.com' THEN
    UPDATE profiles
    SET 
      full_name = 'James Wilson',
      title = 'Tech & Gadgets Curator',
      status = 'approved',
      message = 'Exploring the intersection of technology and everyday life.',
      social_links = '{
        "twitter": "https://twitter.com/jameswtech",
        "linkedin": "https://linkedin.com/in/jameswilsontech",
        "website": "https://jameswilson.tech"
      }',
      is_creator = true
    WHERE id = NEW.id;
  ELSIF NEW.email = 'creator5@example.com' THEN
    UPDATE profiles
    SET 
      full_name = 'Olivia Thompson',
      title = 'Art & Culture Curator',
      status = 'approved',
      message = 'Discovering emerging artists and cultural phenomena.',
      social_links = '{
        "instagram": "https://instagram.com/oliviartcurator",
        "twitter": "https://twitter.com/oliviarthompson",
        "website": "https://oliviathompson.art"
      }',
      is_creator = true
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;