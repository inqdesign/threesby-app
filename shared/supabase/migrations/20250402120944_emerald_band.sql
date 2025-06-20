/*
  # Add Sample Picks for Creators
  
  1. Changes
    - Add sample picks for each creator
    - Each creator gets 3 picks per category
    - Use realistic and diverse content
    - All picks are published and visible
*/

-- Add picks for admin (Eunggyu Lee)
INSERT INTO picks (
  profile_id,
  category,
  title,
  description,
  image_url,
  reference,
  status,
  visible
) 
SELECT 
  profiles.id,
  category,
  title,
  description,
  image_url,
  reference,
  'published',
  true
FROM (
  VALUES
    -- Places
    (
      'places',
      'Hidden Garden Café',
      'A serene oasis in the heart of the city. This café combines lush greenery with exceptional coffee and fresh, seasonal dishes. The courtyard seating is particularly magical during spring.',
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24',
      'Downtown Botanical District'
    ),
    (
      'places',
      'Sunset Cliffs Lookout',
      'The perfect spot to watch the sun dip below the horizon. Arrive an hour before sunset to secure a good viewing spot and bring a blanket for comfort.',
      'https://images.unsplash.com/photo-1503803548695-c2a7b4a5b875',
      'Coastal Park'
    ),
    (
      'places',
      'Mountain Echo Trail',
      'A moderate 3-mile hike that rewards you with panoramic valley views. Best visited during early morning when the mist still clings to the mountains.',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b',
      'National Forest'
    ),
    -- Products
    (
      'products',
      'Minimal Writing Setup',
      'A carefully curated collection of writing essentials that enhance focus and creativity. The fountain pen is a joy to write with.',
      'https://images.unsplash.com/photo-1455390582262-044cdead277a',
      'Studio Neat'
    ),
    (
      'products',
      'Travel Photography Kit',
      'Lightweight yet powerful camera setup perfect for capturing moments on the go. Includes a versatile prime lens.',
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32',
      'Peak Design'
    ),
    (
      'products',
      'Minimalist Desk Lamp',
      'Beautifully designed task light with adjustable color temperature. Perfect for late-night reading or creative work.',
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c',
      'Anglepoise'
    ),
    -- Books
    (
      'books',
      'The Art of Noticing',
      'A transformative guide to becoming more observant of the world around you. Changed how I see everyday details.',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c',
      'Rob Walker'
    ),
    (
      'books',
      'Deep Work',
      'Essential reading for anyone looking to produce meaningful work in an increasingly distracted world.',
      'https://images.unsplash.com/photo-1512820790803-83ca734da794',
      'Cal Newport'
    ),
    (
      'books',
      'The Design of Everyday Things',
      'A masterclass in human-centered design and how it shapes our daily interactions.',
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f',
      'Don Norman'
    )
) AS sample_picks(category, title, description, image_url, reference)
CROSS JOIN (
  SELECT id FROM profiles WHERE email = 'eunggyu.lee@gmail.com'
) AS profiles;

-- Add picks for Alex Chen (Travel & Lifestyle Curator)
INSERT INTO picks (
  profile_id,
  category,
  title,
  description,
  image_url,
  reference,
  status,
  visible
) 
SELECT 
  profiles.id,
  category,
  title,
  description,
  image_url,
  reference,
  'published',
  true
FROM (
  VALUES
    -- Places
    (
      'places',
      'Hidden Ramen Shop',
      'Tucked away in a narrow alley, this family-run ramen shop serves the most authentic tonkotsu ramen outside of Japan.',
      'https://images.unsplash.com/photo-1557872943-16a5ac26437e',
      'Tokyo Food District'
    ),
    (
      'places',
      'Coastal Wine Bar',
      'A charming wine bar perched on cliffs overlooking the Mediterranean. Perfect for sunset wine tasting.',
      'https://images.unsplash.com/photo-1470158499416-75be9aa0c4db',
      'Amalfi Coast'
    ),
    (
      'places',
      'Mountain Coffee Roastery',
      'High-altitude coffee roastery where you can watch the entire bean-to-cup process while enjoying panoramic views.',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
      'Blue Mountain'
    ),
    -- Products
    (
      'products',
      'Artisanal Olive Oil Set',
      'A curated collection of single-origin olive oils from small Mediterranean producers.',
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5',
      'Terra Olive'
    ),
    (
      'products',
      'Travel Spice Kit',
      'Compact spice kit with 12 essential spices for cooking while traveling.',
      'https://images.unsplash.com/photo-1532336414038-cf19250c5757',
      'Nomad Kitchen'
    ),
    (
      'products',
      'Handcrafted Ceramic Plates',
      'Beautiful, travel-inspired ceramic plates made by local artisans.',
      'https://images.unsplash.com/photo-1516223725307-6f76b9182f7e',
      'Artisan Ceramics'
    ),
    -- Books
    (
      'books',
      'The Food Explorer',
      'The true adventures of the 19th-century botanist who traveled the world finding new foods.',
      'https://images.unsplash.com/photo-1589998059171-988d887df646',
      'Daniel Stone'
    ),
    (
      'books',
      'Salt, Fat, Acid, Heat',
      'A masterclass in the four elements of good cooking.',
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f',
      'Samin Nosrat'
    ),
    (
      'books',
      'The World Atlas of Coffee',
      'A comprehensive guide to coffee beans, brewing techniques, and coffee cultures worldwide.',
      'https://images.unsplash.com/photo-1544787219-7f47ccb76574',
      'James Hoffmann'
    )
) AS sample_picks(category, title, description, image_url, reference)
CROSS JOIN (
  SELECT id FROM profiles WHERE email = 'creator@example.com'
) AS profiles;

-- Add picks for Michael Brown (Design Enthusiast)
INSERT INTO picks (
  profile_id,
  category,
  title,
  description,
  image_url,
  reference,
  status,
  visible
) 
SELECT 
  profiles.id,
  category,
  title,
  description,
  image_url,
  reference,
  'published',
  true
FROM (
  VALUES
    -- Places
    (
      'places',
      'Design Museum',
      'A stunning example of modernist architecture housing an incredible collection of design history.',
      'https://images.unsplash.com/photo-1554907984-15263bfd63bd',
      'Cultural District'
    ),
    (
      'places',
      'Concept Store Gallery',
      'Part retail space, part art gallery, this innovative space showcases emerging designers and artists.',
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c',
      'Design Quarter'
    ),
    (
      'places',
      'Typography Café',
      'A café celebrating the art of typography with each room themed after a different typeface.',
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24',
      'Arts District'
    ),
    -- Products
    (
      'products',
      'Modular Desk System',
      'Beautifully designed workspace solution that adapts to your needs while maintaining minimal aesthetics.',
      'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd',
      'Nordic Design'
    ),
    (
      'products',
      'Limited Edition Print Set',
      'Collection of geometric prints inspired by modernist architecture.',
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38',
      'Studio Archive'
    ),
    (
      'products',
      'Handcrafted Leather Journal',
      'Minimalist leather journal that develops a beautiful patina over time.',
      'https://images.unsplash.com/photo-1544816155-12df9643f363',
      'Craft Workshop'
    ),
    -- Books
    (
      'books',
      'Grid Systems',
      'The definitive guide to using grid systems in graphic design.',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c',
      'Josef Müller-Brockmann'
    ),
    (
      'books',
      'The Art of Looking Sideways',
      'A visual feast exploring the relationship between design and how we see the world.',
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f',
      'Alan Fletcher'
    ),
    (
      'books',
      'Dieter Rams: As Little Design as Possible',
      'The comprehensive monograph on one of the most influential designers of all time.',
      'https://images.unsplash.com/photo-1544947987-99018bf76a3b',
      'Sophie Lovell'
    )
) AS sample_picks(category, title, description, image_url, reference)
CROSS JOIN (
  SELECT id FROM profiles WHERE email = 'member@example.com'
) AS profiles;