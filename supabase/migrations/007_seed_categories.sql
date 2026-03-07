-- Agape Gear Categories with Subcategories
-- Migration: 007_seed_categories.sql

-- First, try to delete existing categories to start fresh (optional - remove if you want to keep existing data)
DELETE FROM categories WHERE parent_id IS NOT NULL;
DELETE FROM categories WHERE parent_id IS NULL;

-- Insert parent categories (Men, Women, Accessories, Sale)
INSERT INTO categories (id, name, slug, description, is_active, sort_order) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Men', 'men', 'Men''s clothing collection', true, 1),
  ('11111111-0000-0000-0000-000000000002', 'Women', 'women', 'Women''s clothing collection', true, 2),
  ('44444444-0000-0000-0000-000000000001', 'Accessories', 'accessories', 'Accessories collection', true, 3),
  ('44444444-0000-0000-0000-000000000002', 'Sale', 'sale', 'Sale items', true, 4)
ON CONFLICT (slug) DO NOTHING;

-- Insert subcategories for Men
INSERT INTO categories (id, name, slug, description, parent_id, is_active, sort_order) VALUES
  ('22222222-0000-0000-0000-000000000001', 'Men T-Shirts', 'men-t-shirts', 'Men''s T-Shirts', '11111111-0000-0000-0000-000000000001', true, 1),
  ('22222222-0000-0000-0000-000000000002', 'Men Shirts', 'men-shirts', 'Men''s Shirts', '11111111-0000-0000-0000-000000000001', true, 2),
  ('22222222-0000-0000-0000-000000000003', 'Men Pants', 'men-pants', 'Men''s Pants', '11111111-0000-0000-0000-000000000001', true, 3),
  ('22222222-0000-0000-0000-000000000004', 'Men Shorts', 'men-shorts', 'Men''s Shorts', '11111111-0000-0000-0000-000000000001', true, 4),
  ('22222222-0000-0000-0000-000000000005', 'Men Jackets', 'men-jackets', 'Men''s Jackets', '11111111-0000-0000-0000-000000000001', true, 5),
  ('22222222-0000-0000-0000-000000000006', 'Men Hoodies', 'men-hoodies', 'Men''s Hoodies', '11111111-0000-0000-0000-000000000001', true, 6)
ON CONFLICT (slug) DO NOTHING;

-- Insert subcategories for Women
INSERT INTO categories (id, name, slug, description, parent_id, is_active, sort_order) VALUES
  ('33333333-0000-0000-0000-000000000001', 'Women Tops', 'women-tops', 'Women''s Tops', '11111111-0000-0000-0000-000000000002', true, 1),
  ('33333333-0000-0000-0000-000000000002', 'Women Dresses', 'women-dresses', 'Women''s Dresses', '11111111-0000-0000-0000-000000000002', true, 2),
  ('33333333-0000-0000-0000-000000000003', 'Women Pants', 'women-pants', 'Women''s Pants', '11111111-0000-0000-0000-000000000002', true, 3),
  ('33333333-0000-0000-0000-000000000004', 'Women Skirts', 'women-skirts', 'Women''s Skirts', '11111111-0000-0000-0000-000000000002', true, 4),
  ('33333333-0000-0000-0000-000000000005', 'Women Jackets', 'women-jackets', 'Women''s Jackets', '11111111-0000-0000-0000-000000000002', true, 5),
  ('33333333-0000-0000-0000-000000000006', 'Women Hoodies', 'women-hoodies', 'Women''s Hoodies', '11111111-0000-0000-0000-000000000002', true, 6)
ON CONFLICT (slug) DO NOTHING;

-- Insert subcategories for Accessories
INSERT INTO categories (id, name, slug, description, parent_id, is_active, sort_order) VALUES
  ('55555555-0000-0000-0000-000000000001', 'Hats', 'hats', 'Hats and Caps', '44444444-0000-0000-0000-000000000001', true, 1),
  ('55555555-0000-0000-0000-000000000002', 'Bags', 'bags', 'Bags and Backpacks', '44444444-0000-0000-0000-000000000001', true, 2),
  ('55555555-0000-0000-0000-000000000003', 'Belts', 'belts', 'Belts', '44444444-0000-0000-0000-000000000001', true, 3),
  ('55555555-0000-0000-0000-000000000004', 'Scarves', 'scarves', 'Scarves', '44444444-0000-0000-0000-000000000001', true, 4)
ON CONFLICT (slug) DO NOTHING;
