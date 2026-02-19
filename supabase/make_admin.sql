-- Make the user an admin
UPDATE public.profiles
SET is_admin = TRUE
WHERE id = (SELECT id FROM auth.users WHERE email = 'frazahamad@gmail.com');

-- Verify admin status
SELECT email, is_admin FROM auth.users JOIN public.profiles ON auth.users.id = public.profiles.id WHERE email = 'frazahamad@gmail.com';
