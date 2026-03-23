-- Add land_area_unit column to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS land_area_unit TEXT; -- Cents, Acres, Gunta, Ankanam, Hectare

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'properties' AND column_name = 'land_area_unit';
