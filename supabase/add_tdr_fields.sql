-- Migration to add TDR fields to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS tdr_cert_number TEXT,
ADD COLUMN IF NOT EXISTS tdr_date_of_issue DATE,
ADD COLUMN IF NOT EXISTS tdr_issuing_authority TEXT,
ADD COLUMN IF NOT EXISTS tdr_issuing_authority_other TEXT,
ADD COLUMN IF NOT EXISTS tdr_total_area_available NUMERIC,
ADD COLUMN IF NOT EXISTS tdr_total_area_unit TEXT,
ADD COLUMN IF NOT EXISTS tdr_sale_value NUMERIC,
ADD COLUMN IF NOT EXISTS tdr_sale_value_unit TEXT,
ADD COLUMN IF NOT EXISTS tdr_location TEXT,
ADD COLUMN IF NOT EXISTS tdr_survey_number TEXT,
ADD COLUMN IF NOT EXISTS tdr_zone_classification TEXT,
ADD COLUMN IF NOT EXISTS tdr_total_sale_consideration NUMERIC;
