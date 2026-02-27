-- Add avatar_url column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update RLS policies to allow users to update their own avatar_url (already covered by "Users can update own profile" policy)
