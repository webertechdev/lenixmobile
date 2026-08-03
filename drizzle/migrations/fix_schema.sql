-- ============================================================
-- FIX SCHEMA: Add missing columns and enum values
-- Run this in Supabase SQL Editor to fix your database
-- This is safe to run multiple times (idempotent)
-- ============================================================

-- Step 1: Disable RLS on all tables (required for app to work)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE technicians DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE repairs DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE repair_parts DISABLE ROW LEVEL SECURITY;
ALTER TABLE status_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log DISABLE ROW LEVEL SECURITY;

-- Step 2: Grant all permissions to authenticated users
GRANT ALL ON users TO authenticated;
GRANT ALL ON technicians TO authenticated;
GRANT ALL ON customers TO authenticated;
GRANT ALL ON repairs TO authenticated;
GRANT ALL ON inventory TO authenticated;
GRANT ALL ON repair_parts TO authenticated;
GRANT ALL ON status_history TO authenticated;
GRANT ALL ON audit_log TO authenticated;

-- Step 3: Add 'team_lead' to the role enum (safe - checks if exists first)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
        WHERE pg_type.typname = 'role' AND pg_enum.enumlabel = 'team_lead'
    ) THEN
        ALTER TYPE "public"."role" ADD VALUE 'team_lead';
    END IF;
END $$;

-- Step 4: Add 'role' column to technicians table (safe - checks if exists first)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'technicians' AND column_name = 'role'
    ) THEN
        ALTER TABLE "technicians" ADD COLUMN "role" "role" DEFAULT 'technician' NOT NULL;
    END IF;
END $$;

-- Step 5: Make user_id nullable on technicians (safe - checks first)
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'technicians' AND column_name = 'user_id' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE "technicians" ALTER COLUMN "user_id" DROP NOT NULL;
    END IF;
END $$;

-- Step 6: Insert the first admin user (the system owner)
-- Replace 'YOUR_SUPABASE_USER_ID' with your actual Supabase auth user ID
-- You can find it in Supabase Dashboard → Authentication → Users
-- OR just log in and the app will auto-create it

-- Step 7: Verify the fix
SELECT 'Schema fix complete!' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'technicians' 
ORDER BY ordinal_position;
