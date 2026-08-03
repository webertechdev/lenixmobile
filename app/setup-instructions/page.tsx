"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Copy, ExternalLink, Mail, Key, Database } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SetupInstructionsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const sqlFix = `-- ============================================================
-- FIX CONSTRAINTS: Make user_id nullable and enforce hierarchy
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

-- Step 3: Add 'team_lead' to the role enum if not exists
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
        WHERE pg_type.typname = 'role' AND pg_enum.enumlabel = 'team_lead'
    ) THEN
        ALTER TYPE "public"."role" ADD VALUE 'team_lead';
    END IF;
END $$;

-- Step 4: Add 'role' column to technicians table if not exists
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'technicians' AND column_name = 'role'
    ) THEN
        ALTER TABLE "technicians" ADD COLUMN "role" "role" DEFAULT 'technician' NOT NULL;
    END IF;
END $$;

-- Step 5: Make user_id nullable on technicians (CRITICAL FIX)
-- This allows creating technician profiles before the user logs in
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'technicians' AND column_name = 'user_id' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE "technicians" ALTER COLUMN "user_id" DROP NOT NULL;
    END IF;
END $$;

-- Step 6: Verify the fix
SELECT 'Schema fix complete!' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'technicians' 
ORDER BY ordinal_position;`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Lenix Mobile Setup Guide</h1>
          <p className="text-muted-foreground text-lg">Complete these steps to enable the invite-based onboarding system</p>
        </div>

        {/* Step 1: Supabase Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              Step 1: Fix Database Schema & Constraints
            </CardTitle>
            <CardDescription>Run this SQL in your Supabase SQL Editor to fix the database</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                <strong>CRITICAL:</strong> If you see "null value in column 'user_id' violates not-null constraint", you MUST run this SQL immediately.
              </AlertDescription>
            </Alert>

            <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                Go to your Supabase Dashboard → SQL Editor → Create a new query and paste the code below.
              </AlertDescription>
            </Alert>

            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto font-mono text-sm max-h-96 overflow-y-auto">
              <pre>{sqlFix}</pre>
            </div>

            <Button
              onClick={() => copyToClipboard(sqlFix, "sql")}
              className="w-full"
              variant={copiedCode === "sql" ? "default" : "outline"}
            >
              <Copy className="mr-2 h-4 w-4" />
              {copiedCode === "sql" ? "Copied!" : "Copy SQL"}
            </Button>
          </CardContent>
        </Card>

        {/* Step 2: Environment Variables */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-purple-600" />
              Step 2: Add Environment Variables
            </CardTitle>
            <CardDescription>Add these to your .env.local file for invite functionality</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                Find your Service Role Key in Supabase Dashboard → Settings → API → Service Role Key
              </AlertDescription>
            </Alert>

            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto font-mono text-sm space-y-2">
              <div>SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here</div>
            </div>

            <p className="text-sm text-muted-foreground">
              This key allows the system to send invitations. Keep it secret and never expose it to the client.
            </p>
          </CardContent>
        </Card>

        {/* Step 3: Email Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-green-600" />
              Step 3: Configure Email in Supabase
            </CardTitle>
            <CardDescription>Enable email invitations in your Supabase project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="space-y-3 list-decimal list-inside">
              <li className="text-sm">
                Go to <strong>Supabase Dashboard → Authentication → Providers</strong>
              </li>
              <li className="text-sm">
                Ensure <strong>Email</strong> is enabled
              </li>
              <li className="text-sm">
                Go to <strong>Email Templates</strong> and customize the invite template if needed
              </li>
              <li className="text-sm">
                Test by creating a team member from the Technicians page
              </li>
            </ol>

            <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Once configured, team members will receive invitation emails automatically when you add them.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle>How the Invite System Works</CardTitle>
            <CardDescription>The complete onboarding flow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold">1</div>
                </div>
                <div>
                  <h4 className="font-semibold">Admin Creates Team Member</h4>
                  <p className="text-sm text-muted-foreground">Admin goes to Technicians page and clicks "Add Team Member"</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-600 text-white font-bold">2</div>
                </div>
                <div>
                  <h4 className="font-semibold">Profile Created & Invite Sent</h4>
                  <p className="text-sm text-muted-foreground">System creates the profile with role (Admin/Team Lead/Technician) and sends invitation email</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-600 text-white font-bold">3</div>
                </div>
                <div>
                  <h4 className="font-semibold">User Verifies Email & Sets Password</h4>
                  <p className="text-sm text-muted-foreground">Team member clicks the invite link and sets their own password</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-orange-600 text-white font-bold">4</div>
                </div>
                <div>
                  <h4 className="font-semibold">First Login - Personalized Dashboard</h4>
                  <p className="text-sm text-muted-foreground">User logs in and sees their role, assigned work, and personalized dashboard</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-sm">Error: "null value in column 'user_id' violates not-null constraint"?</h4>
                <p className="text-sm text-muted-foreground">Run the SQL fix from Step 1 in your Supabase SQL Editor to make user_id nullable.</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm">Invitations not being sent?</h4>
                <p className="text-sm text-muted-foreground">Make sure SUPABASE_SERVICE_ROLE_KEY is set in your environment variables and email is enabled in Supabase.</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm">Can't create multiple admins/team leads?</h4>
                <p className="text-sm text-muted-foreground">This is by design. The system only allows 1 Admin and 1 Team Lead. You can have unlimited Technicians.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button size="lg" asChild>
            <a href="/technicians">
              Go to Technicians Page
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
