-- Add sample featured picks
INSERT INTO public.featured_picks (
  category,
  title,
  description,
  image_url,
  reference,
  visible
) VALUES
  (
    'places',
    'Hidden Garden Café',
    'A serene oasis in the heart of the city. This café combines lush greenery with exceptional coffee and fresh, seasonal dishes. The courtyard seating is particularly magical during spring.',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24',
    'Downtown Botanical District',
    true
  ),
  (
    'products',
    'Minimal Desk Setup',
    'A carefully curated collection of desk essentials that enhance focus and creativity. The perfect balance of form and function for productive work.',
    'https://images.unsplash.com/photo-1593062096033-9a26b09da705',
    'Modern Office',
    true
  ),
  (
    'books',
    'The Art of Slow Living',
    'A thoughtful exploration of mindful living in our fast-paced world. Practical insights for creating meaningful daily rituals and finding joy in simplicity.',
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c',
    'Emma Davis',
    true
  );