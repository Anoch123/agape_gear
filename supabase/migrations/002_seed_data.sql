-- Agape Gear E-commerce Platform - Seed Data
-- Migration: 002_seed_data.sql

-- Insert default categories
INSERT INTO categories (name, slug, description, sort_order) VALUES
('T-Shirts', 't-shirts', 'Premium quality t-shirts for everyday wear', 1),
('Hoodies', 'hoodies', 'Comfortable and stylish hoodies', 2),
('Jackets', 'jackets', 'Fashionable jackets for all seasons', 3),
('Pants', 'pants', 'Quality pants and trousers', 4),
('Accessories', 'accessories', 'Complete your look with our accessories', 5)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample products (with explicit column list)
INSERT INTO products (name, slug, description, price, compare_at_price, sku, stock_quantity, category_id, images, sizes, colors, is_featured) 
SELECT 
    name, slug, description, price, compare_at_price, sku, stock_quantity, category_id, images, sizes, colors, is_featured
FROM (
    SELECT 'Classic White Tee' as name, 'classic-white-tee' as slug, 'A timeless white t-shirt made from 100% organic cotton. Perfect for any occasion.' as description, 29.99 as price, 39.99 as compare_at_price, 'TSHIRT-001' as sku, 50 as stock_quantity, (SELECT id FROM categories WHERE slug = 't-shirts' LIMIT 1) as category_id, ARRAY['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'] as images, ARRAY['S', 'M', 'L', 'XL', 'XXL'] as sizes, ARRAY['White'] as colors, true as is_featured
    UNION ALL
    SELECT 'Black Classic Hoodie', 'black-classic-hoodie', 'Premium black hoodie with kangaroo pocket. Soft fleece interior for maximum comfort.', 59.99, 79.99, 'HOODIE-001', 30, (SELECT id FROM categories WHERE slug = 'hoodies' LIMIT 1), ARRAY['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800'], ARRAY['S', 'M', 'L', 'XL', 'XXL'], ARRAY['Black'], true
    UNION ALL
    SELECT 'Denim Jacket', 'denim-jacket', 'Classic denim jacket with modern fit. Vintage wash with brass buttons.', 89.99, 119.99, 'JACKET-001', 20, (SELECT id FROM categories WHERE slug = 'jackets' LIMIT 1), ARRAY['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800'], ARRAY['S', 'M', 'L', 'XL'], ARRAY['Blue', 'Black'], true
    UNION ALL
    SELECT 'Slim Fit Chinos', 'slim-fit-chinos', 'Elegant slim fit chinos in premium cotton twill. Perfect for office or casual wear.', 49.99, 69.99, 'PANTS-001', 40, (SELECT id FROM categories WHERE slug = 'pants' LIMIT 1), ARRAY['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800'], ARRAY['28', '30', '32', '34', '36'], ARRAY['Navy', 'Khaki', 'Black'], false
    UNION ALL
    SELECT 'Graphic Print Tee', 'graphic-print-tee', 'Bold graphic print t-shirt. Made from premium combed cotton.', 34.99, NULL, 'TSHIRT-002', 35, (SELECT id FROM categories WHERE slug = 't-shirts' LIMIT 1), ARRAY['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800'], ARRAY['S', 'M', 'L', 'XL', 'XXL'], ARRAY['White', 'Black', 'Grey'], false
    UNION ALL
    SELECT 'Zip-Up Hoodie', 'zip-up-hoodie', 'Full zip hoodie with adjustable hood. Side pockets for convenience.', 64.99, 84.99, 'HOODIE-002', 25, (SELECT id FROM categories WHERE slug = 'hoodies' LIMIT 1), ARRAY['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800'], ARRAY['S', 'M', 'L', 'XL', 'XXL'], ARRAY['Grey', 'Navy', 'Black'], false
    UNION ALL
    SELECT 'Leather Belt', 'leather-belt', 'Genuine leather belt with brushed metal buckle.', 24.99, NULL, 'ACC-001', 60, (SELECT id FROM categories WHERE slug = 'accessories' LIMIT 1), ARRAY['https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800'], ARRAY['S', 'M', 'L'], ARRAY['Black', 'Brown'], false
    UNION ALL
    SELECT 'Cotton Cap', 'cotton-cap', 'Classic 6-panel cotton cap with adjustable strap.', 19.99, NULL, 'ACC-002', 80, (SELECT id FROM categories WHERE slug = 'accessories' LIMIT 1), ARRAY['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800'], ARRAY['One Size'], ARRAY['Black', 'Navy', 'Grey'], false
    UNION ALL
    SELECT 'Wool Blend Coat', 'wool-blend-coat', 'Elegant wool blend overcoat for the modern professional.', 149.99, 199.99, 'JACKET-002', 15, (SELECT id FROM categories WHERE slug = 'jackets' LIMIT 1), ARRAY['https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800'], ARRAY['S', 'M', 'L', 'XL'], ARRAY['Grey', 'Navy', 'Black'], true
    UNION ALL
    SELECT 'Joggers', 'joggers', 'Comfortable joggers with elastic waistband and cuffs.', 44.99, NULL, 'PANTS-002', 45, (SELECT id FROM categories WHERE slug = 'pants' LIMIT 1), ARRAY['https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800'], ARRAY['S', 'M', 'L', 'XL', 'XXL'], ARRAY['Black', 'Grey', 'Navy'], false
) AS new_products
ON CONFLICT (slug) DO NOTHING;

-- Note: Admin user should be created through Supabase Auth UI or CLI
-- Example CLI command: supabase auth sign-up --email admin@agapegear.com --password yourpassword
-- Then update the user's role in the profiles table:
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@agapegear.com';
