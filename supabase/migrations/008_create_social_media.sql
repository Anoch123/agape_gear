-- Create social_media table
CREATE TABLE IF NOT EXISTS social_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform VARCHAR(50) NOT NULL,
  url TEXT NOT NULL,
  icon VARCHAR(50) NOT NULL DEFAULT 'link',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE social_media ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public can view social_media" ON social_media
  FOR SELECT USING (is_active = true);

-- Allow admin full access
CREATE POLICY "Admins can manage social_media" ON social_media
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Insert default social media
INSERT INTO social_media (platform, url, icon, sort_order) VALUES
  ('Facebook', 'https://facebook.com', 'facebook', 1),
  ('Instagram', 'https://instagram.com', 'instagram', 2),
  ('Twitter', 'https://twitter.com', 'twitter', 3);
