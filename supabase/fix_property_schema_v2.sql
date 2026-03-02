-- 1. Fix Property Schema
-- Ensure all columns required by the new form exist
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS structure_type TEXT, 
ADD COLUMN IF NOT EXISTS land_area DECIMAL, 
ADD COLUMN IF NOT EXISTS floor_number INTEGER,
ADD COLUMN IF NOT EXISTS floor_detail TEXT,
ADD COLUMN IF NOT EXISTS parking_spaces INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS parking_type TEXT,
ADD COLUMN IF NOT EXISTS parking_allocated TEXT,
ADD COLUMN IF NOT EXISTS facilities TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS google_map_link TEXT;

-- 2. Create Amenities Config Table
CREATE TABLE IF NOT EXISTS public.amenities_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    property_types TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.amenities_config ENABLE ROW LEVEL SECURITY;

-- 4. Policies for Amenities Config
CREATE POLICY "Public amenities are viewable by everyone" ON public.amenities_config
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage amenities" ON public.amenities_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- 5. Seed Initial Data
INSERT INTO public.amenities_config (name, property_types) VALUES
('Swimming Pool', '{"Apartment", "Villa", "Farmhouse"}'),
('Gym', '{"Apartment"}'),
('Club House', '{"Apartment"}'),
('Children''s Play Area', '{"Apartment"}'),
('Security', '{"Apartment", "Villa", "Farmhouse", "Land"}'),
('Power Backup', '{"Apartment", "Villa", "Farmhouse"}'),
('Lift', '{"Apartment"}'),
('Park', '{"Apartment", "Villa"}'),
('Rainwater Harvesting', '{"Apartment"}'),
('Private Garden', '{"Villa", "Farmhouse"}'),
('Parking', '{"Apartment", "Villa", "Farmhouse"}'),
('Servant Quarter', '{"Villa"}'),
('Boundary Wall', '{"Land", "Farmhouse"}'),
('Water Connection', '{"Land", "Farmhouse"}'),
('Electricity Connection', '{"Land", "Farmhouse"}'),
('Road Access', '{"Land", "Farmhouse"}'),
('Well', '{"Farmhouse"}'),
('Borewell', '{"Farmhouse"}'),
('Garden', '{"Farmhouse", "Villa"}'),
('Barn', '{"Farmhouse"}'),
('Elevator', '{"Apartment"}'),
('CCTV', '{"Apartment", "Villa", "Farmhouse"}'),
('Fire Safety', '{"Apartment"}'),
('Waiting Area', '{"Apartment"}'),
('Pantry', '{"Apartment"}'),
('AC', '{"Apartment", "Villa"}')
ON CONFLICT (name) DO UPDATE SET property_types = EXCLUDED.property_types;
