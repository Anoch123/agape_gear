-- Create content_pages table for managing FAQ, About Us, Policies, etc.
CREATE TABLE IF NOT EXISTS content_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT,
  page_type TEXT NOT NULL CHECK (
    page_type IN (
      'about',
      'faq',
      'delivery',
      'returns',
      'blog',
      'refund',
      'shipping',
      'terms',
      'privacy',
      'contact'
    )
  ),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE content_pages ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public can read content_pages" ON content_pages
  FOR SELECT USING (is_active = true);

-- Allow admin full access
CREATE POLICY "Admins can manage content_pages" ON content_pages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Create indexes
CREATE INDEX idx_content_pages_slug ON content_pages(slug);
CREATE INDEX idx_content_pages_type ON content_pages(page_type);
CREATE INDEX idx_content_pages_active ON content_pages(is_active);

-- Insert default content pages
INSERT INTO content_pages (title, slug, content, page_type, sort_order) VALUES
(
  'About Us',
  'about',
  'Welcome to Agape Gear - your destination for premium quality clothing designed for comfort and style. Founded with a mission to provide high-quality apparel at affordable prices, we specialize in t-shirts, hoodies, jackets, and accessories.',
  'about',
  1
),
(
  'Frequently Asked Questions',
  'faq',
  '<h2>Frequently Asked Questions</h2>

<h3>How do I track my order?</h3>
<p>You can track your order by logging into your account and visiting the Orders section. You will find tracking information for all your orders.</p>

<h3>What is your return policy?</h3>
<p>We offer a 30-day return policy for all unworn items with tags attached. Please visit our Returns page for more information.</p>

<h3>How do I contact customer support?</h3>
<p>You can reach us at support@agapegear.com or call +94 77 123 4567 during business hours.</p>

<h3>Do you offer international shipping?</h3>
<p>Currently, we ship within Sri Lanka only. We are working on expanding our shipping options to other countries soon.</p>',
  'faq',
  2
),
(
  'Delivery Information',
  'delivery',
  '<h2>Delivery Information</h2>

<h3>Shipping Methods</h3>
<p>We offer standard and express shipping options. Standard delivery takes 3-5 business days, while express delivery takes 1-2 business days.</p>

<h3>Shipping Costs</h3>
<p>Free shipping on orders over LKR 5,000. Standard shipping: LKR 500. Express shipping: LKR 1,000.</p>

<h3>Delivery Areas</h3>
<p>We currently deliver to all major cities in Sri Lanka including Colombo, Kandy, Galle, Jaffna, and more.</p>',
  'delivery',
  3
),
(
  'Returns & Exchanges',
  'returns',
  '<h2>Returns & Exchanges</h2>

<h3>Return Policy</h3>
<p>We offer a 30-day return policy for all unworn items with tags attached. Items must be in their original condition with all tags attached.</p>

<h3>How to Return</h3>
<p>1. Log into your account and go to Orders<br>
2. Select the order containing the item you wish to return<br>
3. Click on "Return Item" and follow the instructions<br>
4. Pack the item securely and ship it back to us</p>

<h3>Refund Timeline</h3>
<p>Refunds are processed within 5-7 business days after we receive your return. The amount will be credited to your original payment method.</p>',
  'returns',
  4
),
(
  'Agape Blog',
  'blog',
  '<h2>Welcome to Agape Blog</h2>
<p>Stay updated with the latest fashion trends, styling tips, and news from Agape Gear.</p>

<h3>Latest Posts</h3>
<p>Check back soon for new articles about fashion, sustainability, and style tips from our team.</p>',
  'blog',
  5
),
(
  'Refund Policy',
  'refund',
  '<h2>Refund Policy</h2>

<h3>Refund Eligibility</h3>
<p>We offer full refunds for items returned within 30 days of purchase. Items must be unworn, unwashed, and have all original tags attached.</p>

<h3>Non-Refundable Items</h3>
<p>Sale items, accessories, and intimates are not eligible for refund unless defective.</p>

<h3>Refund Process</h3>
<p>Once we receive your return, we will inspect the item and process your refund within 5-7 business days. The amount will be credited to your original payment method.</p>

<h3>Exchange Options</h3>
<p>If you prefer an exchange, please indicate this when submitting your return request. We will ship the replacement item once we receive your return.</p>',
  'refund',
  6
),
(
  'Shipping Policy',
  'shipping',
  '<h2>Shipping Policy</h2>

<h3>Processing Time</h3>
<p>Orders are processed within 1-2 business days. Orders placed before 2 PM will be shipped the same day.</p>

<h3>Shipping Methods</h3>
<p><strong>Standard Shipping:</strong> 3-5 business days - LKR 500 (Free over LKR 5,000)<br>
<strong>Express Shipping:</strong> 1-2 business days - LKR 1,000</p>

<h3>Order Tracking</h3>
<p>Once your order is shipped, you will receive a tracking number via email. You can track your order on our website or the courier''s website.</p>

<h3>Shipping Delays</h3>
<p>During peak seasons or promotional periods, shipping may take longer than usual. We appreciate your patience.</p>',
  'shipping',
  7
),
(
  'Terms of Service',
  'terms',
  '<h2>Terms of Service</h2>

<h3>Acceptance of Terms</h3>
<p>By accessing and using the Agape Gear website, you accept and agree to be bound by the terms and provision of this agreement.</p>

<h3>Use License</h3>
<p>Permission is granted to temporarily use Agape Gear for personal, non-commercial transitory viewing only.</p>

<h3>Disclaimer</h3>
<p>The materials on Agape Gear''s website are provided on an ''as is'' basis. Agape Gear makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties.</p>

<h3>Limitations</h3>
<p>In no event shall Agape Gear or its suppliers be liable for any damages arising out of the use or inability to use the materials on our website.</p>

<h3>Governing Law</h3>
<p>These terms and conditions are governed by and construed in accordance with the laws of Sri Lanka.</p>',
  'terms',
  8
),
(
  'Privacy Policy',
  'privacy',
  '<h2>Privacy Policy</h2>

<h3>Information We Collect</h3>
<p>We collect personal information that you provide to us, including name, email address, phone number, and shipping address when you create an account or place an order.</p>

<h3>How We Use Your Information</h3>
<p>We use your information to process orders, communicate with you about your orders, and improve our services.</p>

<h3>Information Protection</h3>
<p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>

<h3>Third-Party Disclosure</h3>
<p>We do not sell, trade, or otherwise transfer your personal information to outside parties unless we provide users with advance notice.</p>

<h3>Contact Us</h3>
<p>If you have any questions about our Privacy Policy, please contact us at support@agapegear.com.</p>',
  'privacy',
  9
),
(
  'Contact Us',
  'contact',
  '<h2>Contact Us</h2>

<h3>Get in Touch</h3>
<p>We would love to hear from you! Feel free to reach out to us through any of the following methods:</p>

<h3>Email</h3>
<p>support@agapegear.com</p>

<h3>Phone</h3>
<p>+94 77 123 4567</p>

<h3>Address</h3>
<p>Colombo, Sri Lanka</p>

<h3>Business Hours</h3>
<p>Monday - Friday: 9:00 AM - 6:00 PM<br>
Saturday: 9:00 AM - 1:00 PM<br>
Sunday: Closed</p>

<h3>Response Time</h3>
<p>We aim to respond to all inquiries within 24-48 business hours.</p>',
  'contact',
  10
)
ON CONFLICT (slug) DO NOTHING;
