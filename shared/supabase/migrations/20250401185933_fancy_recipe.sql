/*
  # Add Picks for Remaining Curators

  1. Changes
    - Add picks for James Wilson (Tech & Gadgets)
    - Add picks for Olivia Thompson (Art & Culture)
    - Each curator gets 3 picks per category
*/

-- Add picks for James Wilson (Tech & Gadgets Curator)
INSERT INTO picks (
  id, profile_id, category, title, description, image_url, reference, status, visible
) VALUES
  -- Places
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator4@example.com'),
    'places',
    'Innovation Hub',
    'A collaborative workspace filled with cutting-edge technology and maker spaces.',
    'https://images.unsplash.com/photo-1497366216548-37526070297c',
    'Tech District',
    'published',
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator4@example.com'),
    'places',
    'Retro Gaming Museum',
    'Interactive museum showcasing the evolution of gaming technology.',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f',
    'Gaming District',
    'published',
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator4@example.com'),
    'places',
    'Smart Home Experience Center',
    'Showcase of future living with fully integrated smart home technologies.',
    'https://images.unsplash.com/photo-1558002038-1055907df827',
    'Future Living',
    'published',
    true
  ),

  -- Products
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator4@example.com'),
    'products',
    'Ergonomic Mechanical Keyboard',
    'Custom-designed mechanical keyboard with hot-swappable switches and ergonomic layout.',
    'https://images.unsplash.com/photo-1595225476474-87563907198a',
    'Tech Craft',
    'published',
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator4@example.com'),
    'products',
    'Smart Desk Lamp',
    'Adaptive lighting system that adjusts based on time of day and activity.',
    'https://images.unsplash.com/photo-1534381072782-99d9953740e3',
    'Ambient Tech',
    'published',
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator4@example.com'),
    'products',
    'Portable Power Station',
    'Compact power solution for mobile workspaces and outdoor tech use.',
    'https://images.unsplash.com/photo-1618410320928-25665C3a6621',
    'Power Nomad',
    'published',
    true
  ),

  -- Books
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator4@example.com'),
    'books',
    'The Innovators',
    'How a Group of Hackers, Geniuses, and Geeks Created the Digital Revolution',
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c',
    'Walter Isaacson',
    'published',
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator4@example.com'),
    'books',
    'Digital Minimalism',
    'Choosing a Focused Life in a Noisy World',
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f',
    'Cal Newport',
    'published',
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator4@example.com'),
    'books',
    'Make: Electronics',
    'Learning Through Discovery',
    'https://images.unsplash.com/photo-1537432376769-00f5c2f4c8d2',
    'Charles Platt',
    'published',
    true
  );

-- Add picks for Olivia Thompson (Art & Culture Curator)
INSERT INTO picks (
  id, profile_id, category, title, description, image_url, reference, status, visible
) VALUES
  -- Places
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator5@example.com'),
    'places',
    'Underground Art Gallery',
    'Former subway station transformed into an immersive art space.',
    'https://images.unsplash.com/photo-1577083552431-6e5fd75a9475',
    'Arts District',
    'published',
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator5@example.com'),
    'places',
    'Street Art District',
    'Vibrant neighborhood showcasing large-scale murals and installations.',
    'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8',
    'Urban Canvas',
    'published',
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator5@example.com'),
    'places',
    'Contemporary Dance Studio',
    'Historic warehouse converted into a modern dance and performance space.',
    'https://images.unsplash.com/photo-1578763363228-6e6c126b4c24',
    'Movement Space',
    'published',
    true
  ),

  -- Products
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator5@example.com'),
    'products',
    'Artist Travel Set',
    'Compact watercolor kit designed for urban sketching.',
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f',
    'Art Nomad',
    'published',
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator5@example.com'),
    'products',
    'Digital Art Tablet',
    'Professional-grade drawing tablet with natural paper-like texture.',
    'https://images.unsplash.com/photo-1572044162444-ad60f128bdea',
    'Digital Canvas',
    'published',
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator5@example.com'),
    'products',
    'Sculpture Tools Kit',
    'Essential tools for ceramic and clay work, perfect for beginners.',
    'https://images.unsplash.com/photo-1461344577544-4e5dc9487184',
    'Clay Works',
    'published',
    true
  ),

  -- Books
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator5@example.com'),
    'books',
    'Ways of Seeing',
    'Classic exploration of how we view art and visual culture.',
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c',
    'John Berger',
    'published',
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator5@example.com'),
    'books',
    'Art & Fear',
    'Observations on the Perils and Rewards of Artmaking',
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f',
    'David Bayles',
    'published',
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator5@example.com'),
    'books',
    'The Story of Art',
    'A comprehensive journey through art history.',
    'https://images.unsplash.com/photo-1553714198-c1d2d83fb1c0',
    'E.H. Gombrich',
    'published',
    true
  );