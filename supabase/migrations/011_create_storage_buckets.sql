-- Create storage bucket for site assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-assets',
  'site-assets',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to site-assets
CREATE POLICY "Public can view site-assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'site-assets');

-- Allow authenticated users to upload to site-assets
CREATE POLICY "Authenticated users can upload site-assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'site-assets' AND auth.role() IN ('authenticated', 'admin', 'superadmin'));

-- Allow admins to delete from site-assets
CREATE POLICY "Admins can delete site-assets" ON storage.objects
  FOR DELETE USING (bucket_id = 'site-assets' AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  ));
