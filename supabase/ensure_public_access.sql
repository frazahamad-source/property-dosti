-- FIX PUBLIC VIEW ACCESS
-- This script ensures valid public access to properties and broker profiles.

-- 1. Properties: Allow everyone to see active properties
DROP POLICY IF EXISTS "Public properties are viewable by everyone." ON properties;
CREATE POLICY "Public properties are viewable by everyone." ON properties
FOR SELECT USING (is_active = true);

-- 2. Profiles: Allow everyone to see broker names/phones (needed for property cards)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles
FOR SELECT USING (true);

-- 3. Storage: Allow everyone to see property images
DROP POLICY IF EXISTS "Property images are publicly accessible" ON storage.objects;
CREATE POLICY "Property images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'property-images');
