-- Add is_sold column to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS is_sold BOOLEAN DEFAULT false;

-- Create an index to quickly filter out sold properties if needed
CREATE INDEX IF NOT EXISTS idx_properties_is_sold ON public.properties(is_sold);
