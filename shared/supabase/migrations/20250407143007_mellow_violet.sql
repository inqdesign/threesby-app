-- Generate a unique invite code for the admin user
UPDATE public.profiles
SET 
  invite_code = encode(gen_random_bytes(6), 'hex'),
  is_creator = true,
  status = 'approved'
WHERE email = 'eunggyu.lee@gmail.com'
RETURNING invite_code;