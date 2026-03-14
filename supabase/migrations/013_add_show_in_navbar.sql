-- Add show_in_navbar column to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS show_in_navbar BOOLEAN DEFAULT false;

-- Update existing top-level categories to show in navbar by default
UPDATE categories SET show_in_navbar = true WHERE parent_id IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_categories_show_in_navbar ON categories(show_in_navbar) WHERE show_in_navbar = true;
