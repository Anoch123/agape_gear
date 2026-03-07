-- Create site_settings table for storing site configuration
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public can view site_settings" ON site_settings
  FOR SELECT USING (true);

-- Allow admin full access
CREATE POLICY "Admins can manage site_settings" ON site_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Insert default site settings
INSERT INTO site_settings (key, value) VALUES
  ('logo', '/logo.png'),
  ('site_name', 'Agape Gear'),
  ('site_description', 'Premium Quality Clothing'),
  ('hero_title', 'Premium Quality Clothing'),
  ('hero_subtitle', 'Discover our collection of premium t-shirts, hoodies, jackets, and accessories designed for comfort and style.'),
  ('hero_image', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&h=600&fit=crop'),
  ('hero_cta_text', 'Shop Now'),
  ('hero_cta_link', '/products')
ON CONFLICT (key) DO NOTHING;

-- Create index
CREATE INDEX idx_site_settings_key ON site_settings(key);
