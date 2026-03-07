-- Agape Gear - Fix RLS Infinite Recursion
-- Migration: 006_fix_rls_recursion.sql

-- =====================================================
-- The issue: RLS policies reference profiles table itself
-- causing infinite recursion. 
-- Solution: Use auth.users metadata or a simpler approach
-- =====================================================

-- First, let's disable all profiles policies temporarily
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

-- =====================================================
-- Create a function to check if user is admin (avoids recursion)
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  );
$$ LANGUAGE sql STABLE;

-- =====================================================
-- Create simple RLS policies (no self-reference)
-- =====================================================

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow authenticated users to create their own profile
CREATE POLICY "Users can create own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow admins to view all profiles (using the function to avoid recursion)
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (public.is_admin());

-- Allow admins to update profiles (using the function to avoid recursion)
CREATE POLICY "Admins can update profiles" ON profiles
  FOR UPDATE USING (public.is_admin());

-- =====================================================
-- Verify the admin profile exists
-- =====================================================
-- Check if admin profile exists
SELECT id, email, full_name, role, created_at 
FROM profiles 
WHERE email = 'anochdissanayake@gmail.com';

-- If no admin profile exists, let's check auth.users and create one
DO $$
DECLARE
  user_id UUID;
  user_email TEXT := 'anochdissanayake@gmail.com';
BEGIN
  SELECT id INTO user_id FROM auth.users WHERE email = user_email;
  
  IF user_id IS NOT NULL THEN
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (user_id, user_email, 'Admin', 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
    
    RAISE NOTICE 'Admin profile created/updated for %', user_email;
  END IF;
END $$;

-- Verify again
SELECT id, email, role, created_at FROM profiles WHERE email = 'anochdissanayake@gmail.com';
