/*
  # Add Sample Users and Their Content

  1. Changes
    - Add sample picks for demonstration
    - Maintain data consistency with existing schema
    - Avoid foreign key constraint issues

  2. Security
    - Maintain existing RLS policies
    - Keep proper role assignments
*/

-- Add sample picks for demonstration
INSERT INTO picks (
  id,
  profile_id,
  category,
  title,
  description,
  image_url,
  reference,
  status,
  created_at,
  visible
) VALUES
  -- Travel & Photography Picks
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'admin@example.com' LIMIT 1),
    'places',
    'Hidden Waterfall Sanctuary',
    'A secluded waterfall tucked away in the mountains. The early morning mist creates an ethereal atmosphere perfect for photography.',
    'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9',
    'Secret Valley National Park',
    'published',
    NOW(),
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'admin@example.com' LIMIT 1),
    'products',
    'Peak Design Travel Tripod',
    'Revolutionary design that packs down to the size of a water bottle. Perfect for travel photography without compromising stability.',
    'https://images.unsplash.com/photo-1495707902641-75cac588d2e9',
    'Peak Design',
    'published',
    NOW(),
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'admin@example.com' LIMIT 1),
    'books',
    'The Art of Slow Photography',
    'A masterful guide to mindful photography and capturing moments that matter. Changed how I approach every shot.',
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f',
    'Maria Santos',
    'published',
    NOW(),
    true
  ),

  -- Design & Tech Picks
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator@example.com' LIMIT 1),
    'places',
    'Design District Workshop',
    'A collaborative workspace where designers and makers come together. The industrial architecture is inspiring.',
    'https://images.unsplash.com/photo-1497366216548-37526070297c',
    'Creative Hub',
    'published',
    NOW(),
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator@example.com' LIMIT 1),
    'products',
    'Minimal Desk Setup',
    'Carefully curated workspace essentials that boost productivity while maintaining aesthetic harmony.',
    'https://images.unsplash.com/photo-1593062096033-9a26b09da705',
    'Studio Neat',
    'published',
    NOW(),
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator@example.com' LIMIT 1),
    'books',
    'Design Systems Handbook',
    'The definitive guide to creating and maintaining scalable design systems. Essential reading for every product designer.',
    'https://images.unsplash.com/photo-1589998059171-988d887df646',
    'Design Systems Co',
    'published',
    NOW(),
    true
  ),

  -- Literature & Culture Picks
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'member@example.com' LIMIT 1),
    'places',
    'Literary Café Archive',
    'A charming bookstore café with rare first editions and the best Spanish coffee in town.',
    'https://images.unsplash.com/photo-1526721940322-10fb6e3ae94a',
    'Historic District',
    'published',
    NOW(),
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'member@example.com' LIMIT 1),
    'products',
    'Vintage Writing Desk',
    'Beautifully restored 1920s writing desk. The perfect companion for long writing sessions.',
    'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd',
    'Antique Restoration Co',
    'published',
    NOW(),
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'member@example.com' LIMIT 1),
    'books',
    'The Shadow Lines',
    'A masterpiece of contemporary literature that explores memory, time, and identity.',
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c',
    'Amitav Ghosh',
    'published',
    NOW(),
    true
  );