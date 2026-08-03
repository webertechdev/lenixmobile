-- Disable RLS on all tables to allow the app to work without complex policies
-- Run this in your Supabase SQL Editor for a quick fix during development

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE technicians DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE repairs DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE repair_parts DISABLE ROW LEVEL SECURITY;
ALTER TABLE status_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT ALL ON users TO authenticated;
GRANT ALL ON technicians TO authenticated;
GRANT ALL ON customers TO authenticated;
GRANT ALL ON repairs TO authenticated;
GRANT ALL ON inventory TO authenticated;
GRANT ALL ON repair_parts TO authenticated;
GRANT ALL ON status_history TO authenticated;
GRANT ALL ON audit_log TO authenticated;

-- Allow anon user to authenticate
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Ensure the role enum includes team_lead
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
        WHERE pg_type.typname = 'role' AND pg_enum.enumlabel = 'team_lead'
    ) THEN
        ALTER TYPE "public"."role" ADD VALUE 'team_lead';
    END IF;
END $$;

-- Add role column to technicians if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'technicians' AND column_name = 'role'
    ) THEN
        ALTER TABLE "technicians" ADD COLUMN "role" "role" DEFAULT 'technician' NOT NULL;
    END IF;
END $$;

-- Make user_id nullable on technicians if it's not already
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'technicians' AND column_name = 'user_id' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE "technicians" ALTER COLUMN "user_id" DROP NOT NULL;
    END IF;
END $$;
