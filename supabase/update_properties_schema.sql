-- Add new columns to properties table for expanded form
-- structure_type, land_area, floor_detail, parking_allocated, facilities, google_map_link

ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS structure_type TEXT, -- Villa, Apartment, Farmhouse, Land
ADD COLUMN IF NOT EXISTS land_area DECIMAL, -- Sqft or Cents
ADD COLUMN IF NOT EXISTS floor_detail TEXT, -- e.g. "3rd Floor"
ADD COLUMN IF NOT EXISTS parking_allocated TEXT, -- e.g. "1 Covered"
ADD COLUMN IF NOT EXISTS facilities TEXT[], -- Array of strings
ADD COLUMN IF NOT EXISTS google_map_link TEXT;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'properties';
