-- Agape Gear E-commerce Platform - Create Admin User
-- Migration: 003_create_admin_user.sql

-- =====================================================
-- STEP 1: Create user in auth.users
-- Run this in your terminal using Supabase CLI:
-- supabase auth sign-up --email anochdissanayake@gmail.com --password "AgapeAdmin2024!"
-- =====================================================

-- =====================================================
-- STEP 2: Update profile to admin role
-- Run this in Supabase SQL Editor (after Step 1):
-- =====================================================

-- First, let's create the profile if it doesn't exist
INSERT INTO profiles (id, email, full_name, role)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', 'Admin'),
    'admin'
FROM auth.users 
WHERE email = 'anochdissanayake@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- If profile already exists, just update the role
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'anochdissanayake@gmail.com';

-- =====================================================
-- Verify the admin user was created correctly
-- =====================================================
SELECT id, email, role, created_at FROM profiles WHERE email = 'anochdissanayake@gmail.com';
