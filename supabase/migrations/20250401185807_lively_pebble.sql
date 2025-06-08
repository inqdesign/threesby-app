/*
  # Add Sample Picks for All Curators

  1. Changes
    - Add sample picks for each curator
    - Ensure each curator has exactly 3 picks per category
    - Use realistic and diverse content
*/

-- Add picks for Emma Davis (Food & Travel Curator)
INSERT INTO picks (
  id, profile_id, category, title, description, image_url, reference, status, visible
) VALUES
  -- Places
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator1@example.com'),
    'places',
    'Hidden Ramen Shop',
    'Tucked away in a narrow alley, this family-run ramen shop serves the most authentic tonkotsu ramen outside of Japan.',
    'https://images.unsplash.com/photo-1557872943-16a5ac26437e',
    'Tokyo Food District',
    'published',
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator1@example.com'),
    'places',
    'Coastal Wine Bar',
    'A charming wine bar perched on cliffs overlooking the Mediterranean. Perfect for sunset wine tasting.',
    'https://images.unsplash.com/photo-1470158499416-75be9aa0c4db',
    'Amalfi Coast',
    'published',
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator1@example.com'),
    'places',
    'Mountain Coffee Roastery',
    'High-altitude coffee roastery where you can watch the entire bean-to-cup process while enjoying panoramic views.',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
    'Blue Mountain',
    'published',
    true
  ),

  -- Products
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator1@example.com'),
    'products',
    'Artisanal Olive Oil Set',
    'A curated collection of single-origin olive oils from small Mediterranean producers.',
    'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5',
    'Terra Olive',
    'published',
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator1@example.com'),
    'products',
    'Travel Spice Kit',
    'Compact spice kit with 12 essential spices for cooking while traveling.',
    'https://images.unsplash.com/photo-1532336414038-cf19250c5757',
    'Nomad Kitchen',
    'published',
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator1@example.com'),
    'products',
    'Handcrafted Ceramic Plates',
    'Beautiful, travel-inspired ceramic plates made by local artisans.',
    'https://images.unsplash.com/photo-1516223725307-6f76b9182f7e',
    'Artisan Ceramics',
    'published',
    true
  ),

  -- Books
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator1@example.com'),
    'books',
    'The Food Explorer',
    'The true adventures of the 19th-century botanist who traveled the world finding new foods.',
    'https://images.unsplash.com/photo-1589998059171-988d887df646',
    'Daniel Stone',
    'published',
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator1@example.com'),
    'books',
    'Salt, Fat, Acid, Heat',
    'A masterclass in the four elements of good cooking.',
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f',
    'Samin Nosrat',
    'published',
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator1@example.com'),
    'books',
    'The World Atlas of Coffee',
    'A comprehensive guide to coffee beans, brewing techniques, and coffee cultures worldwide.',
    'https://images.unsplash.com/photo-1544787219-7f47ccb76574',
    'James Hoffmann',
    'published',
    true
  );

-- Add picks for David Kim (Design & Architecture Curator)
INSERT INTO picks (
  id, profile_id, category, title, description, image_url, reference, status, visible
) VALUES
  -- Places
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator2@example.com'),
    'places',
    'Minimalist Art Gallery',
    'A converted industrial space showcasing contemporary minimalist art and installations.',
    'https://images.unsplash.com/photo-1577083552431-6e5fd75a9475',
    'Design District',
    'published',
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator2@example.com'),
    'places',
    'Geometric Gardens',
    'A modern interpretation of traditional Japanese gardens using geometric shapes and clean lines.',
    'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7',
    'Botanical Park',
    'published',
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator2@example.com'),
    'places',
    'Brutalist Library',
    'A stunning example of brutalist architecture housing a vast collection of design books.',
    'https://images.unsplash.com/photo-1541339907198-e08756dedf3f',
    'University Campus',
    'published',
    true
  ),

  -- Products
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator2@example.com'),
    'products',
    'Modular Desk System',
    'Customizable desk system that adapts to any workspace while maintaining minimal aesthetics.',
    'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd',
    'Nordic Design Co',
    'published',
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator2@example.com'),
    'products',
    'Architectural Lighting',
    'Sculptural LED lighting fixture that doubles as an art piece.',
    'https://images.unsplash.com/photo-1507494924047-60b8ee826ca9',
    'Light Form',
    'published',
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator2@example.com'),
    'products',
    'Concrete Planter Set',
    'Minimalist concrete planters in various geometric shapes.',
    'https://images.unsplash.com/photo-1485955900006-10f4d324d411',
    'Modern Botanics',
    'published',
    true
  ),

  -- Books
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator2@example.com'),
    'books',
    'The Design of Everyday Things',
    'The ultimate guide to human-centered design.',
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c',
    'Don Norman',
    'published',
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator2@example.com'),
    'books',
    'Thinking with Type',
    'Essential guide to using typography in visual communication.',
    'https://images.unsplash.com/photo-1553714198-c1d2d83fb1c0',
    'Ellen Lupton',
    'published',
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator2@example.com'),
    'books',
    'The Future of Architecture',
    'Exploring sustainable and innovative architectural solutions for tomorrow.',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6',
    'Marc Kushner',
    'published',
    true
  );

-- Add picks for Sofia Martinez (Lifestyle & Wellness Curator)
INSERT INTO picks (
  id, profile_id, category, title, description, image_url, reference, status, visible
) VALUES
  -- Places
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator3@example.com'),
    'places',
    'Eco Wellness Retreat',
    'Sustainable wellness center offering yoga, meditation, and organic farming experiences.',
    'https://images.unsplash.com/photo-1545205597-3d9d02c29597',
    'Green Valley',
    'published',
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator3@example.com'),
    'places',
    'Urban Meditation Garden',
    'A peaceful oasis in the city with sound therapy installations and meditation pods.',
    'https://images.unsplash.com/photo-1528164344705-47542687000d',
    'City Center',
    'published',
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator3@example.com'),
    'places',
    'Zero-Waste Café',
    'Community-focused café practicing sustainable operations and offering workshops.',
    'https://images.unsplash.com/photo-1525610553991-2bede1a236e2',
    'Eco District',
    'published',
    true
  ),

  -- Products
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator3@example.com'),
    'products',
    'Sustainable Yoga Mat',
    'Made from recycled materials with natural cork surface.',
    'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f',
    'Earth Yoga',
    'published',
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator3@example.com'),
    'products',
    'Meditation Cushion Set',
    'Ergonomic meditation cushions made from organic materials.',
    'https://images.unsplash.com/photo-1545205597-3d9d02c29597',
    'Mindful Home',
    'published',
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator3@example.com'),
    'products',
    'Zero-Waste Starter Kit',
    'Essential items for beginning a zero-waste lifestyle.',
    'https://images.unsplash.com/photo-1610741083757-1ae88e1a17f7',
    'Eco Basics',
    'published',
    true
  ),

  -- Books
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator3@example.com'),
    'books',
    'The Joy of Less',
    'A minimalist living guide that helps you declutter your life.',
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c',
    'Francine Jay',
    'published',
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator3@example.com'),
    'books',
    'Mindful Eating',
    'Transform your relationship with food through mindfulness.',
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f',
    'Jan Chozen Bays',
    'published',
    true
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'creator3@example.com'),
    'books',
    'The Zero-Waste Home',
    'Practical guide to reducing waste in every area of your life.',
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f',
    'Bea Johnson',
    'published',
    true
  );