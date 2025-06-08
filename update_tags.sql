-- SQL script to update existing picks with tags
-- First, check if any picks have tags already
SELECT COUNT(*) FROM picks WHERE tags IS NOT NULL AND array_length(tags, 1) > 0;

-- Books category tags
UPDATE picks
SET tags = ARRAY['fiction', 'bestseller', 'recommended']
WHERE category = 'books' AND (tags IS NULL OR array_length(tags, 1) = 0) AND id IN (
  SELECT id FROM picks WHERE category = 'books' ORDER BY created_at DESC LIMIT 5
);

-- Add different tags to other books
UPDATE picks
SET tags = ARRAY['non-fiction', 'biography', 'educational']
WHERE category = 'books' AND (tags IS NULL OR array_length(tags, 1) = 0) AND id IN (
  SELECT id FROM picks WHERE category = 'books' AND (tags IS NULL OR array_length(tags, 1) = 0) ORDER BY created_at DESC LIMIT 5 OFFSET 5
);

-- Places category tags
UPDATE picks
SET tags = ARRAY['travel', 'vacation', 'restaurant']
WHERE category = 'places' AND (tags IS NULL OR array_length(tags, 1) = 0) AND id IN (
  SELECT id FROM picks WHERE category = 'places' ORDER BY created_at DESC LIMIT 5
);

-- Add different tags to other places
UPDATE picks
SET tags = ARRAY['cafe', 'local', 'hidden-gem']
WHERE category = 'places' AND (tags IS NULL OR array_length(tags, 1) = 0) AND id IN (
  SELECT id FROM picks WHERE category = 'places' AND (tags IS NULL OR array_length(tags, 1) = 0) ORDER BY created_at DESC LIMIT 5 OFFSET 5
);

-- Products category tags
UPDATE picks
SET tags = ARRAY['tech', 'gadget', 'essential']
WHERE category = 'products' AND (tags IS NULL OR array_length(tags, 1) = 0) AND id IN (
  SELECT id FROM picks WHERE category = 'products' ORDER BY created_at DESC LIMIT 5
);

-- Add different tags to other products
UPDATE picks
SET tags = ARRAY['fashion', 'lifestyle', 'design']
WHERE category = 'products' AND (tags IS NULL OR array_length(tags, 1) = 0) AND id IN (
  SELECT id FROM picks WHERE category = 'products' AND (tags IS NULL OR array_length(tags, 1) = 0) ORDER BY created_at DESC LIMIT 5 OFFSET 5
);

-- Add some custom tags for specific picks based on titles
UPDATE picks
SET tags = ARRAY['classic', 'literature', 'must-read']
WHERE category = 'books' AND LOWER(title) LIKE '%classic%' AND (tags IS NULL OR array_length(tags, 1) = 0);

UPDATE picks
SET tags = ARRAY['travel', 'adventure', 'bucket-list']
WHERE category = 'places' AND LOWER(title) LIKE '%travel%' AND (tags IS NULL OR array_length(tags, 1) = 0);

UPDATE picks
SET tags = ARRAY['innovation', 'premium', 'trending']
WHERE category = 'products' AND LOWER(title) LIKE '%new%' AND (tags IS NULL OR array_length(tags, 1) = 0);

-- Set empty array for any remaining picks without tags
UPDATE picks
SET tags = ARRAY[]::text[]
WHERE tags IS NULL;

-- Count how many picks were updated
SELECT COUNT(*) FROM picks WHERE array_length(tags, 1) > 0;
