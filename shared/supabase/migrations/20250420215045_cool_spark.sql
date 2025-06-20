-- Create initial curator invites
INSERT INTO public.curator_invites (
  code,
  full_name,
  expires_at,
  created_by,
  status
)
SELECT
  encode(gen_random_bytes(6), 'hex') as code,
  name,
  now() + interval '7 days' as expires_at,
  (SELECT id FROM profiles WHERE is_admin = true LIMIT 1) as created_by,
  'pending' as status
FROM (
  VALUES 
    ('Donghyun Kim'),
    ('David Seo'),
    ('Jules Toulemonde'),
    ('Boram Kim'),
    ('Claudio Guglieri')
) AS names(name);