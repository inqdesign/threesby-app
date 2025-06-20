-- First, let's create 5 new curators
DO $$
DECLARE
  curator1_id uuid := gen_random_uuid();
  curator2_id uuid := gen_random_uuid();
  curator3_id uuid := gen_random_uuid();
  curator4_id uuid := gen_random_uuid();
  curator5_id uuid := gen_random_uuid();
BEGIN
  -- Insert curator users
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
      curator1_id,
      'olivia.thompson@example.com',
      crypt('password123', gen_salt('bf')),
      '{"full_name": "Olivia Thompson"}'::jsonb,
      'authenticated',
      'authenticated',
      now(),
      now()
    ),
    (
      curator2_id,
      'james.wilson@example.com',
      crypt('password123', gen_salt('bf')),
      '{"full_name": "James Wilson"}'::jsonb,
      'authenticated',
      'authenticated',
      now(),
      now()
    ),
    (
      curator3_id,
      'sophia.martinez@example.com',
      crypt('password123', gen_salt('bf')),
      '{"full_name": "Sophia Martinez"}'::jsonb,
      'authenticated',
      'authenticated',
      now(),
      now()
    ),
    (
      curator4_id,
      'lucas.kim@example.com',
      crypt('password123', gen_salt('bf')),
      '{"full_name": "Lucas Kim"}'::jsonb,
      'authenticated',
      'authenticated',
      now(),
      now()
    ),
    (
      curator5_id,
      'isabella.patel@example.com',
      crypt('password123', gen_salt('bf')),
      '{"full_name": "Isabella Patel"}'::jsonb,
      'authenticated',
      'authenticated',
      now(),
      now()
    );

  -- Update curator profiles
  UPDATE public.profiles
  SET
    title = CASE 
      WHEN id = curator1_id THEN 'Art & Culture Curator'
      WHEN id = curator2_id THEN 'Tech & Innovation Curator'
      WHEN id = curator3_id THEN 'Sustainable Living Curator'
      WHEN id = curator4_id THEN 'Urban Design Curator'
      ELSE 'Global Cuisine Curator'
    END,
    status = 'approved',
    is_creator = true,
    message = CASE 
      WHEN id = curator1_id THEN 'Discovering emerging artists and cultural phenomena around the world'
      WHEN id = curator2_id THEN 'Exploring the intersection of technology and everyday life'
      WHEN id = curator3_id THEN 'Sharing sustainable living practices and eco-friendly discoveries'
      WHEN id = curator4_id THEN 'Finding beauty in urban spaces and architectural innovation'
      ELSE 'Exploring global flavors and culinary traditions'
    END,
    social_links = CASE 
      WHEN id = curator1_id THEN '{"instagram": "https://instagram.com/olivia.art", "website": "https://oliviathompson.art"}'
      WHEN id = curator2_id THEN '{"twitter": "https://twitter.com/jameswtech", "linkedin": "https://linkedin.com/in/jameswilson"}'
      WHEN id = curator3_id THEN '{"instagram": "https://instagram.com/sophia.eco", "website": "https://sophiamartinez.com"}'
      WHEN id = curator4_id THEN '{"instagram": "https://instagram.com/lucasdesigns", "website": "https://lucaskim.design"}'
      ELSE '{"instagram": "https://instagram.com/isabella.cuisine", "website": "https://isabellapatel.food"}'
    END::jsonb,
    invite_code = encode(gen_random_bytes(6), 'hex')
  WHERE id IN (curator1_id, curator2_id, curator3_id, curator4_id, curator5_id);

  -- Set three curators as featured
  UPDATE public.profiles
  SET is_featured = true
  WHERE id IN (curator1_id, curator3_id, curator5_id);

  -- Add picks for Olivia Thompson (Art & Culture)
  INSERT INTO public.picks (
    profile_id,
    category,
    title,
    description,
    image_url,
    reference,
    status,
    visible,
    created_at,
    updated_at
  ) VALUES
    -- Places
    (
      curator1_id,
      'places',
      'Contemporary Art Museum',
      'A stunning museum showcasing emerging artists and interactive installations.',
      'https://images.unsplash.com/photo-1554907984-15263bfd63bd',
      'Modern Art District',
      'published',
      true,
      NOW(),
      NOW()
    ),
    (
      curator1_id,
      'places',
      'Street Art Gallery',
      'An urban gallery celebrating local street artists and muralists.',
      'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8',
      'Urban Canvas',
      'published',
      true,
      NOW(),
      NOW()
    ),
    (
      curator1_id,
      'places',
      'Cultural Center',
      'A vibrant space hosting performances, exhibitions, and workshops.',
      'https://images.unsplash.com/photo-1561089489-f13d5e730d72',
      'Downtown Arts',
      'published',
      true,
      NOW(),
      NOW()
    ),
    -- Products
    (
      curator1_id,
      'products',
      'Artist Travel Kit',
      'Compact watercolor set perfect for urban sketching.',
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f',
      'Art Nomad',
      'published',
      true,
      NOW(),
      NOW()
    ),
    (
      curator1_id,
      'products',
      'Digital Art Tablet',
      'Professional-grade drawing tablet with natural paper-like texture.',
      'https://images.unsplash.com/photo-1572044162444-ad60f128bdea',
      'Digital Canvas',
      'published',
      true,
      NOW(),
      NOW()
    ),
    (
      curator1_id,
      'products',
      'Ceramic Tools Set',
      'Essential tools for ceramic work and sculpture.',
      'https://images.unsplash.com/photo-1461344577544-4e5dc9487184',
      'Clay Works',
      'published',
      true,
      NOW(),
      NOW()
    ),
    -- Books
    (
      curator1_id,
      'books',
      'The Artist''s Way',
      'A transformative guide to discovering and recovering your creative self.',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c',
      'Julia Cameron',
      'published',
      true,
      NOW(),
      NOW()
    ),
    (
      curator1_id,
      'books',
      'Art & Fear',
      'Observations on the perils and rewards of artmaking.',
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f',
      'David Bayles',
      'published',
      true,
      NOW(),
      NOW()
    ),
    (
      curator1_id,
      'books',
      'Ways of Seeing',
      'A groundbreaking exploration of how we view art and visual culture.',
      'https://images.unsplash.com/photo-1553714198-c1d2d83fb1c0',
      'John Berger',
      'published',
      true,
      NOW(),
      NOW()
    );

  -- Add picks for Sophia Martinez (Sustainable Living)
  INSERT INTO public.picks (
    profile_id,
    category,
    title,
    description,
    image_url,
    reference,
    status,
    visible,
    created_at,
    updated_at
  ) VALUES
    -- Places
    (
      curator3_id,
      'places',
      'Zero Waste Store',
      'A package-free shop offering sustainable household essentials.',
      'https://images.unsplash.com/photo-1610741083757-1ae88e1a17f7',
      'Green Living',
      'published',
      true,
      NOW(),
      NOW()
    ),
    (
      curator3_id,
      'places',
      'Community Garden',
      'Urban farming project teaching sustainable food production.',
      'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735',
      'Urban Harvest',
      'published',
      true,
      NOW(),
      NOW()
    ),
    (
      curator3_id,
      'places',
      'Eco Workshop',
      'Space hosting sustainability workshops and community events.',
      'https://images.unsplash.com/photo-1525610553991-2bede1a236e2',
      'Green Hub',
      'published',
      true,
      NOW(),
      NOW()
    ),
    -- Products
    (
      curator3_id,
      'products',
      'Bamboo Essentials Set',
      'Sustainable bathroom basics made from renewable bamboo.',
      'https://images.unsplash.com/photo-1523437113738-bbd3cc89fb19',
      'Eco Basics',
      'published',
      true,
      NOW(),
      NOW()
    ),
    (
      curator3_id,
      'products',
      'Solar Power Bank',
      'Portable solar charger for sustainable energy on the go.',
      'https://images.unsplash.com/photo-1617788138017-80ad40651399',
      'Green Energy',
      'published',
      true,
      NOW(),
      NOW()
    ),
    (
      curator3_id,
      'products',
      'Reusable Food Wraps',
      'Organic cotton food wraps replacing single-use plastic.',
      'https://images.unsplash.com/photo-1542012204088-be7e0e0f8cd3',
      'Zero Waste Kitchen',
      'published',
      true,
      NOW(),
      NOW()
    ),
    -- Books
    (
      curator3_id,
      'books',
      'Zero Waste Home',
      'The ultimate guide to reducing waste in your household.',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c',
      'Bea Johnson',
      'published',
      true,
      NOW(),
      NOW()
    ),
    (
      curator3_id,
      'books',
      'Sustainable Living',
      'Practical steps toward an eco-friendly lifestyle.',
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f',
      'Anna Watson',
      'published',
      true,
      NOW(),
      NOW()
    ),
    (
      curator3_id,
      'books',
      'The Future We Choose',
      'A hopeful vision for a sustainable world.',
      'https://images.unsplash.com/photo-1544947987-99018bf76a3b',
      'Christiana Figueres',
      'published',
      true,
      NOW(),
      NOW()
    );

  -- Add picks for Isabella Patel (Global Cuisine)
  INSERT INTO public.picks (
    profile_id,
    category,
    title,
    description,
    image_url,
    reference,
    status,
    visible,
    created_at,
    updated_at
  ) VALUES
    -- Places
    (
      curator5_id,
      'places',
      'Hidden Spice Market',
      'Traditional market offering rare spices and ingredients.',
      'https://images.unsplash.com/photo-1509358271058-acd22cc93898',
      'Spice Bazaar',
      'published',
      true,
      NOW(),
      NOW()
    ),
    (
      curator5_id,
      'places',
      'Artisan Bakery',
      'Family-run bakery specializing in global bread traditions.',
      'https://images.unsplash.com/photo-1509440159596-0249088772ff',
      'World Bread',
      'published',
      true,
      NOW(),
      NOW()
    ),
    (
      curator5_id,
      'places',
      'Fusion Restaurant',
      'Innovative dining combining global culinary traditions.',
      'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17',
      'Global Kitchen',
      'published',
      true,
      NOW(),
      NOW()
    ),
    -- Products
    (
      curator5_id,
      'products',
      'Global Spice Collection',
      'Curated set of essential spices from around the world.',
      'https://images.unsplash.com/photo-1532336414038-cf19250c5757',
      'Spice Journey',
      'published',
      true,
      NOW(),
      NOW()
    ),
    (
      curator5_id,
      'products',
      'Handcrafted Ceramics',
      'Artisanal plates and bowls inspired by global designs.',
      'https://images.unsplash.com/photo-1516223725307-6f76b9182f7e',
      'World Ceramics',
      'published',
      true,
      NOW(),
      NOW()
    ),
    (
      curator5_id,
      'products',
      'Traditional Cookware',
      'Authentic cooking vessels from different cultures.',
      'https://images.unsplash.com/photo-1556911261-6bd341186b2f',
      'Global Kitchen Tools',
      'published',
      true,
      NOW(),
      NOW()
    ),
    -- Books
    (
      curator5_id,
      'books',
      'World Spice Journey',
      'Exploring the history and use of spices across cultures.',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c',
      'Ana Martinez',
      'published',
      true,
      NOW(),
      NOW()
    ),
    (
      curator5_id,
      'books',
      'Global Street Food',
      'A celebration of street food traditions worldwide.',
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f',
      'David Chang',
      'published',
      true,
      NOW(),
      NOW()
    ),
    (
      curator5_id,
      'books',
      'The Flavor Atlas',
      'A comprehensive guide to world cuisines and ingredients.',
      'https://images.unsplash.com/photo-1544947987-99018bf76a3b',
      'Sarah Chen',
      'published',
      true,
      NOW(),
      NOW()
    );

  -- Set all picks as published
  UPDATE public.picks
  SET status = 'published'
  WHERE profile_id IN (SELECT id FROM public.profiles WHERE email IN ('olivia.thompson@example.com', 'sophia.martinez@example.com', 'isabella.patel@example.com'));

END $$;