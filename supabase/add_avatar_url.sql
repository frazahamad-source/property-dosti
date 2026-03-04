-- =============================================
-- Add avatar_url column to profiles table
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Add the avatar_url column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Allow public read access to the column (it's already covered by existing RLS policies)
-- No additional RLS changes needed since profiles table already has policies.

-- 3. Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'avatar_url';
