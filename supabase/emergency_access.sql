/*
  EMERGENCY ACCESS SCRIPT
  This will temporarily DISABLE Row Level Security on the profiles table.
  This removes ALL permission checks, eliminating the recursion loop.
*/

-- 1. Disable RLS on profiles
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Verify
SELECT count(*) FROM public.profiles;
SELECT 'RLS Disabled - Try Login Now' as status;
