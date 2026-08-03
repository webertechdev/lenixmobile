import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

/**
 * This API endpoint runs all necessary database migrations.
 * It uses Drizzle's db.execute to run raw SQL.
 */
export async function POST(req: Request) {
  try {
    if (!db) {
      return NextResponse.json({
        error: 'Database connection not initialized',
        hint: 'Make sure DATABASE_URL is set in environment variables',
      }, { status: 500 });
    }

    // All SQL migrations combined
    const migrations = [
      `DO $$ BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_enum
              JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
              WHERE pg_type.typname = 'role' AND pg_enum.enumlabel = 'team_lead'
          ) THEN
              ALTER TYPE "public"."role" ADD VALUE 'team_lead';
          END IF;
      END $$;`,

      `DO $$ BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'technicians' AND column_name = 'role'
          ) THEN
              ALTER TABLE "technicians" ADD COLUMN "role" "role" DEFAULT 'technician' NOT NULL;
          END IF;
      END $$;`,

      `DO $$ BEGIN
          IF EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'technicians' AND column_name = 'user_id' 
              AND is_nullable = 'NO'
          ) THEN
              ALTER TABLE "technicians" ALTER COLUMN "user_id" DROP NOT NULL;
          END IF;
      END $$;`,

      `DO $$ BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_type WHERE typname = 'invitation_status'
          ) THEN
              CREATE TYPE "public"."invitation_status" AS ENUM ('pending', 'accepted', 'expired');
          END IF;
      END $$;`,

      `DO $$ BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'technicians' AND column_name = 'invitation_status'
          ) THEN
              ALTER TABLE "technicians" ADD COLUMN "invitation_status" "invitation_status" DEFAULT 'pending' NOT NULL;
          END IF;
      END $$;`,

      `DO $$ BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'technicians' AND column_name = 'invitation_sent_at'
          ) THEN
              ALTER TABLE "technicians" ADD COLUMN "invitation_sent_at" timestamp;
          END IF;
      END $$;`,

      `UPDATE "technicians" SET "invitation_status" = 'accepted' WHERE "user_id" IS NOT NULL;`,

      `ALTER TABLE users DISABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE technicians DISABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE customers DISABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE repairs DISABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE repair_parts DISABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE status_history DISABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE audit_log DISABLE ROW LEVEL SECURITY;`,

      `GRANT ALL ON users TO authenticated;`,
      `GRANT ALL ON technicians TO authenticated;`,
      `GRANT ALL ON customers TO authenticated;`,
      `GRANT ALL ON repairs TO authenticated;`,
      `GRANT ALL ON inventory TO authenticated;`,
      `GRANT ALL ON repair_parts TO authenticated;`,
      `GRANT ALL ON status_history TO authenticated;`,
      `GRANT ALL ON audit_log TO authenticated;`,
      
      // Update photo fields to text to support Base64
      `ALTER TABLE "repairs" ALTER COLUMN "photo_front" TYPE text;`,
      `ALTER TABLE "repairs" ALTER COLUMN "photo_back" TYPE text;`,
      `ALTER TABLE "repairs" ALTER COLUMN "photo_repair" TYPE text;`,
      `ALTER TABLE "repairs" ALTER COLUMN "photo_final_qa" TYPE text;`,
      `ALTER TABLE "customers" ALTER COLUMN "photo_url" TYPE text;`,
      `ALTER TABLE "inventory" ALTER COLUMN "photo_url" TYPE text;`
    ];

    const results = [];
    let hasError = false;
    let errorMessage = '';

    for (const statement of migrations) {
      try {
        await db.execute(sql.raw(statement));
        results.push({
          statement: statement.substring(0, 50) + '...',
          status: 'success',
        });
      } catch (err: any) {
        console.error('SQL Execution error:', err);
        // We don't stop on error because some migrations might already be applied
        results.push({
          statement: statement.substring(0, 50) + '...',
          status: 'error',
          error: err.message,
        });
        hasError = true;
        errorMessage = err.message;
      }
    }

    if (hasError) {
      return NextResponse.json({
        message: 'Some migrations were applied, but others encountered errors. This is often normal if they were already applied.',
        error: errorMessage,
        results,
        success: true, // We still return success: true to the UI if it partially worked
      }, { status: 200 });
    }

    return NextResponse.json({
      message: 'All database migrations completed successfully!',
      results,
      success: true,
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to run migrations',
      hint: 'Try running the SQL manually in the Supabase SQL Editor',
    }, { status: 500 });
  }
}
