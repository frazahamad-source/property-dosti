-- Fix Category Check Constraint to allow 'both'
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_category_check;

ALTER TABLE public.properties ADD CONSTRAINT properties_category_check 
CHECK (category IN ('residential', 'commercial', 'land', 'both'));
