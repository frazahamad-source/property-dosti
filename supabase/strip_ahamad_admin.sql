-- STRIP ADMIN PRIVILEGES FROM AHAMAD (properties@westlinebuilders.com)
-- This user is a Broker and should NOT have administrator access.

-- 1. Remove admin flag
UPDATE public.profiles
SET is_admin = FALSE,
    updated_at = NOW()
WHERE id = (
    SELECT id FROM auth.users
    WHERE email = 'properties@westlinebuilders.com'
);

-- 2. Verify the change
SELECT
    p.id,
    p.name,
    u.email,
    p.is_admin,
    p.status
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'properties@westlinebuilders.com';
