-- Agape Gear - Direct Admin User Fix
-- Run this in Supabase SQL Editor to fix admin login issues

-- =====================================================
-- STEP 1: First, let's check if the user exists in auth.users
-- =====================================================
SELECT id, email, created_at, email_confirmed_at 
FROM auth.users 
WHERE email = 'anochdissanayake@gmail.com';

-- =====================================================
-- STEP 2: Fix RLS policies to allow profile creation
-- =====================================================
-- Drop and recreate policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can create own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "Admins can update profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- =====================================================
-- STEP 3: Create or update the admin profile
-- =====================================================
-- Get the user ID first
DO $$
DECLARE
  user_id UUID;
  user_email TEXT := 'anochdissanayake@gmail.com';
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO user_id FROM auth.users WHERE email = user_email;
  
  IF user_id IS NOT NULL THEN
    -- Insert or update the profile with admin role
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (user_id, user_email, 'Admin', 'admin')
    ON CONFLICT (id) DO UPDATE SET
      role = 'admin',
      email = EXCLUDED.email;
    
    RAISE NOTICE 'Admin profile created/updated for %', user_email;
  ELSE
    RAISE NOTICE 'User with email % not found in auth.users', user_email;
  END IF;
END $$;

-- =====================================================
-- STEP 4: Verify the admin profile exists
-- =====================================================
SELECT id, email, full_name, role, created_at 
FROM profiles 
WHERE email = 'anochdissanayake@gmail.com';

-- =====================================================
-- STEP 5: Check all profiles to see current state
-- =====================================================
SELECT id, email, role, created_at FROM profiles ORDER BY created_at DESC LIMIT 10;
