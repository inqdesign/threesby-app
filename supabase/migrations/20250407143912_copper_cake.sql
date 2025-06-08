-- Create public users with explicit IDs
DO $$
DECLARE
  user1_id uuid := gen_random_uuid();
  user2_id uuid := gen_random_uuid();
  creator1_id uuid := gen_random_uuid();
  creator2_id uuid := gen_random_uuid();
  creator3_id uuid := gen_random_uuid();
BEGIN
  -- Insert public users
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    raw_user_meta_data,
    role,
    aud,
    created_at,
    updated_at
  ) VALUES 
    (
      user1_id,
      'user1@example.com',
      crypt('password123', gen_salt('bf')),
      '{"full_name": "John Smith"}'::jsonb,
      'authenticated',
      'authenticated',
      now(),
      now()
    ),
    (
      user2_id,
      'user2@example.com',
      crypt('password123', gen_salt('bf')),
      '{"full_name": "Sarah Wilson"}'::jsonb,
      'authenticated',
      'authenticated',
      now(),
      now()
    );

  -- Insert creators
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    raw_user_meta_data,
    role,
    aud,
    created_at,
    updated_at
  ) VALUES 
    (
      creator1_id,
      'creator1@example.com',
      crypt('password123', gen_salt('bf')),
      '{"full_name": "Emma Davis"}'::jsonb,
      'authenticated',
      'authenticated',
      now(),
      now()
    ),
    (
      creator2_id,
      'creator2@example.com',
      crypt('password123', gen_salt('bf')),
      '{"full_name": "Michael Chen"}'::jsonb,
      'authenticated',
      'authenticated',
      now(),
      now()
    ),
    (
      creator3_id,
      'creator3@example.com',
      crypt('password123', gen_salt('bf')),
      '{"full_name": "Sofia Rodriguez"}'::jsonb,
      'authenticated',
      'authenticated',
      now(),
      now()
    );

  -- Update profiles for public users
  UPDATE public.profiles
  SET
    title = CASE 
      WHEN email = 'user1@example.com' THEN 'Design Enthusiast'
      ELSE 'Travel Lover'
    END,
    status = 'approved',
    message = CASE 
      WHEN email = 'user1@example.com' THEN 'Always looking for beautiful design and inspiring stories'
      ELSE 'Exploring the world one city at a time'
    END,
    social_links = CASE 
      WHEN email = 'user1@example.com' THEN '{"twitter": "https://twitter.com/johnsmith", "instagram": "https://instagram.com/johnsmith"}'
      ELSE '{"instagram": "https://instagram.com/sarahwilson", "linkedin": "https://linkedin.com/in/sarahwilson"}'
    END::jsonb
  WHERE email IN ('user1@example.com', 'user2@example.com');

  -- Update creator profiles
  UPDATE public.profiles
  SET
    title = CASE 
      WHEN email = 'creator1@example.com' THEN 'Food & Travel Curator'
      WHEN email = 'creator2@example.com' THEN 'Tech & Design Curator'
      ELSE 'Lifestyle & Wellness Curator'
    END,
    status = 'approved',
    is_creator = true,
    message = CASE 
      WHEN email = 'creator1@example.com' THEN 'Exploring hidden culinary gems and sharing travel stories'
      WHEN email = 'creator2@example.com' THEN 'Discovering innovative tech solutions and design inspiration'
      ELSE 'Sharing mindful living tips and wellness discoveries'
    END,
    social_links = CASE 
      WHEN email = 'creator1@example.com' THEN '{"instagram": "https://instagram.com/emmadavis", "website": "https://emmadavis.co"}'
      WHEN email = 'creator2@example.com' THEN '{"twitter": "https://twitter.com/michaelchen", "linkedin": "https://linkedin.com/in/michaelchen"}'
      ELSE '{"instagram": "https://instagram.com/sofiarodriguez", "website": "https://sofiawellness.com"}'
    END::jsonb,
    invite_code = encode(gen_random_bytes(6), 'hex')
  WHERE email LIKE 'creator%@example.com';

  -- Add picks for Emma Davis (creator1)
  INSERT INTO public.picks (
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
        'A tiny, authentic ramen shop tucked away in a quiet alley. Their tonkotsu ramen is life-changing.',
        'https://images.unsplash.com/photo-1557872943-16a5ac26437e',
        'Tokyo Food District'
      ),
      (
        'places',
        'Mountain View Café',
        'Perched on a cliff, this café offers breathtaking views and the best locally roasted coffee.',
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
        'Blue Mountain'
      ),
      (
        'places',
        'Secret Garden Restaurant',
        'A beautiful restaurant hidden within a historic garden. The seasonal menu is exceptional.',
        'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17',
        'Botanical Gardens'
      ),
      -- Products
      (
        'products',
        'Artisanal Cooking Set',
        'Hand-forged cooking tools that make every meal preparation a joy.',
        'https://images.unsplash.com/photo-1556911261-6bd341186b2f',
        'Craftsman Tools'
      ),
      (
        'products',
        'Travel Spice Collection',
        'A perfectly curated set of essential spices in travel-friendly containers.',
        'https://images.unsplash.com/photo-1532336414038-cf19250c5757',
        'Spice Traders'
      ),
      (
        'products',
        'Ceramic Pour-Over Set',
        'Beautiful handmade ceramic coffee set that makes the perfect cup every time.',
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
        'Artisan Ceramics'
      ),
      -- Books
      (
        'books',
        'The Art of Simple Food',
        'A timeless guide to cooking with seasonal ingredients and basic techniques.',
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c',
        'Alice Waters'
      ),
      (
        'books',
        'World Street Food',
        'Journey through the world''s most exciting street food scenes.',
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f',
        'Anthony Bourdain'
      ),
      (
        'books',
        'The Mindful Kitchen',
        'Combining mindfulness practices with cooking for a more meaningful experience.',
        'https://images.unsplash.com/photo-1544947987-99018bf76a3b',
        'Sarah Black'
      )
  ) AS sample_picks(category, title, description, image_url, reference)
  CROSS JOIN (
    SELECT id FROM profiles WHERE email = 'creator1@example.com'
  ) AS profiles;

  -- Add picks for Michael Chen (creator2)
  INSERT INTO public.picks (
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
        'Innovation Hub',
        'A collaborative workspace filled with cutting-edge technology and creative minds.',
        'https://images.unsplash.com/photo-1497366216548-37526070297c',
        'Tech District'
      ),
      (
        'places',
        'Design Museum',
        'A stunning collection of modern design, architecture, and digital art.',
        'https://images.unsplash.com/photo-1554907984-15263bfd63bd',
        'Arts Quarter'
      ),
      (
        'places',
        'Future Lab',
        'Interactive technology exhibits showcasing the latest innovations.',
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
        'Science Center'
      ),
      -- Products
      (
        'products',
        'Minimal Desk Setup',
        'A perfectly curated collection of desk essentials for maximum productivity.',
        'https://images.unsplash.com/photo-1593062096033-9a26b09da705',
        'Modern Office'
      ),
      (
        'products',
        'Smart Home Starter Kit',
        'Essential smart home devices that work seamlessly together.',
        'https://images.unsplash.com/photo-1558002038-1055907df827',
        'Smart Living'
      ),
      (
        'products',
        'Ergonomic Work Setup',
        'The ultimate ergonomic workspace solution for comfort and productivity.',
        'https://images.unsplash.com/photo-1524758631624-e2822e304c36',
        'Ergonomics Pro'
      ),
      -- Books
      (
        'books',
        'The Design of Everyday Things',
        'A classic guide to human-centered design principles.',
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c',
        'Don Norman'
      ),
      (
        'books',
        'Digital Minimalism',
        'Finding focus in a noisy world through intentional technology use.',
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f',
        'Cal Newport'
      ),
      (
        'books',
        'Future of Design',
        'Exploring how technology is shaping the future of design.',
        'https://images.unsplash.com/photo-1544947987-99018bf76a3b',
        'John Maeda'
      )
  ) AS sample_picks(category, title, description, image_url, reference)
  CROSS JOIN (
    SELECT id FROM profiles WHERE email = 'creator2@example.com'
  ) AS profiles;

  -- Add picks for Sofia Rodriguez (creator3)
  INSERT INTO public.picks (
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
        'Wellness Retreat',
        'A peaceful sanctuary offering yoga, meditation, and holistic healing.',
        'https://images.unsplash.com/photo-1545205597-3d9d02c29597',
        'Healing Center'
      ),
      (
        'places',
        'Urban Garden',
        'A community garden promoting sustainable living and mindful connection.',
        'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735',
        'Green Space'
      ),
      (
        'places',
        'Mindfulness Studio',
        'A beautiful space dedicated to meditation and mindful movement practices.',
        'https://images.unsplash.com/photo-1545205597-3d9d02c29597',
        'Zen Center'
      ),
      -- Products
      (
        'products',
        'Sustainable Home Kit',
        'Essential items for starting a zero-waste lifestyle.',
        'https://images.unsplash.com/photo-1610741083757-1ae88e1a17f7',
        'Eco Living'
      ),
      (
        'products',
        'Meditation Essentials',
        'Carefully selected items for creating a peaceful meditation space.',
        'https://images.unsplash.com/photo-1545205597-3d9d02c29597',
        'Mindful Space'
      ),
      (
        'products',
        'Wellness Journal Set',
        'Beautiful journals and tools for tracking your wellness journey.',
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f',
        'Mindful Living'
      ),
      -- Books
      (
        'books',
        'The Joy of Less',
        'A minimalist guide to decluttering your life and finding happiness.',
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c',
        'Francine Jay'
      ),
      (
        'books',
        'Mindful Eating',
        'Transform your relationship with food through mindfulness practices.',
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f',
        'Jan Chozen Bays'
      ),
      (
        'books',
        'The Wellness Project',
        'A practical guide to creating sustainable wellness habits.',
        'https://images.unsplash.com/photo-1544947987-99018bf76a3b',
        'Phoebe Lapine'
      )
  ) AS sample_picks(category, title, description, image_url, reference)
  CROSS JOIN (
    SELECT id FROM profiles WHERE email = 'creator3@example.com'
  ) AS profiles;
END $$;