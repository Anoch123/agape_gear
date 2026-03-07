-- Add shipping details to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS shipping_address TEXT,
ADD COLUMN IF NOT EXISTS shipping_city TEXT,
ADD COLUMN IF NOT EXISTS shipping_postal_code TEXT,
ADD COLUMN IF NOT EXISTS shipping_country TEXT DEFAULT 'Sri Lanka',
ADD COLUMN IF NOT EXISTS shipping_phone TEXT;
