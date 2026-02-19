-- Delete the user from auth.users
-- This will automatically delete the corresponding profile due to ON DELETE CASCADE
DELETE FROM auth.users WHERE email = 'frazahamad@gmail.com';

-- Verify deletion
SELECT * FROM auth.users WHERE email = 'frazahamad@gmail.com';
