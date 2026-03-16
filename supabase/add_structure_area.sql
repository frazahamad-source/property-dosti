-- Add structure_area column to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS structure_area numeric;
