"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, CheckCircle2, AlertTriangle, ExternalLink, Smartphone } from "lucide-react";
import { toast } from "sonner";

export default function SetupGuidePage() {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20 mb-2">
            <Smartphone className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Lenix Mobile Setup Guide
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
            Complete step-by-step instructions to get your Aftersales Management System running
          </p>
        </div>

        <Tabs defaultValue="step1" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="step1">Step 1</TabsTrigger>
            <TabsTrigger value="step2">Step 2</TabsTrigger>
            <TabsTrigger value="step3">Step 3</TabsTrigger>
            <TabsTrigger value="step4">Step 4</TabsTrigger>
          </TabsList>

          {/* Step 1: Get DATABASE_URL */}
          <TabsContent value="step1" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">1</span>
                  Get Your DATABASE_URL from Supabase
                </CardTitle>
                <CardDescription>
                  Find and copy your database connection string
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-950 dark:border-blue-800">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      📍 Where to Find It:
                    </p>
                    <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-2 list-decimal list-inside">
                      <li>Go to <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">app.supabase.com</a></li>
                      <li>Select your project (lenixmobile)</li>
                      <li>Click <strong>Settings</strong> in the left sidebar</li>
                      <li>Click <strong>Database</strong></li>
                      <li>Find the <strong>"Connection string"</strong> section</li>
                      <li>Select <strong>Connection Mode: Transaction</strong> (important!)</li>
                      <li>Copy the entire connection string</li>
                    </ol>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 dark:bg-yellow-950 dark:border-yellow-800">
                    <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                      ⚠️ Important:
                    </p>
                    <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                      <li>✓ Use <strong>Transaction Mode</strong> (port 6543), NOT direct connection</li>
                      <li>✓ The string should look like: <code className="bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded text-xs">postgresql://postgres.[project-ref]:password@aws-0-[region].pooler.supabase.com:6543/postgres</code></li>
                      <li>✓ Replace <code className="bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded text-xs">[project-ref]</code> and <code className="bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded text-xs">[region]</code> with your actual values</li>
                    </ul>
                  </div>
                </div>

                <Button className="w-full" asChild>
                  <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Supabase Dashboard
                  </a>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step 2: Run SQL Script */}
          <TabsContent value="step2" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">2</span>
                  Run the RLS Disable Script
                </CardTitle>
                <CardDescription>
                  Disable Row Level Security to allow database access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 dark:bg-green-950 dark:border-green-800">
                    <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
                      ✓ What This Does:
                    </p>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Disables Row Level Security (RLS) on all tables so your app can read and write data. This is temporary for setup; you can enable proper RLS policies later.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">SQL Script to Run:</Label>
                    <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                      <pre>{`-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE technicians DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE repairs DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE repair_parts DISABLE ROW LEVEL SECURITY;
ALTER TABLE status_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON technicians TO authenticated;
GRANT ALL ON customers TO authenticated;
GRANT ALL ON repairs TO authenticated;
GRANT ALL ON inventory TO authenticated;
GRANT ALL ON repair_parts TO authenticated;
GRANT ALL ON status_history TO authenticated;
GRANT ALL ON audit_log TO authenticated;

-- Fix schema: add team_lead to role enum
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
        WHERE pg_type.typname = 'role' AND pg_enum.enumlabel = 'team_lead'
    ) THEN
        ALTER TYPE "public"."role" ADD VALUE 'team_lead';
    END IF;
END $$;

-- Add role column to technicians
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'technicians' AND column_name = 'role'
    ) THEN
        ALTER TABLE "technicians" ADD COLUMN "role" "role" DEFAULT 'technician' NOT NULL;
    END IF;
END $$;

-- Make user_id nullable on technicians
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'technicians' AND column_name = 'user_id' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE "technicians" ALTER COLUMN "user_id" DROP NOT NULL;
    END IF;
END $$;`}</pre>
                    </div>
                    <Button
                      onClick={() => copyToClipboard(`-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE technicians DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE repairs DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE repair_parts DISABLE ROW LEVEL SECURITY;
ALTER TABLE status_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON technicians TO authenticated;
GRANT ALL ON customers TO authenticated;
GRANT ALL ON repairs TO authenticated;
GRANT ALL ON inventory TO authenticated;
GRANT ALL ON repair_parts TO authenticated;
GRANT ALL ON status_history TO authenticated;
GRANT ALL ON audit_log TO authenticated;

-- Fix schema: add team_lead to role enum
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
        WHERE pg_type.typname = 'role' AND pg_enum.enumlabel = 'team_lead'
    ) THEN
        ALTER TYPE "public"."role" ADD VALUE 'team_lead';
    END IF;
END $$;

-- Add role column to technicians
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'technicians' AND column_name = 'role'
    ) THEN
        ALTER TABLE "technicians" ADD COLUMN "role" "role" DEFAULT 'technician' NOT NULL;
    END IF;
END $$;

-- Make user_id nullable on technicians
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'technicians' AND column_name = 'user_id' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE "technicians" ALTER COLUMN "user_id" DROP NOT NULL;
    END IF;
END $$;`)}
                      className="w-full"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {copied ? "Copied!" : "Copy SQL Script"}
                    </Button>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-950 dark:border-blue-800">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      📍 How to Run:
                    </p>
                    <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-2 list-decimal list-inside">
                      <li>Go to Supabase Dashboard → SQL Editor</li>
                      <li>Click <strong>New Query</strong></li>
                      <li>Paste the SQL script above</li>
                      <li>Click <strong>Run</strong></li>
                      <li>You should see "Success. No rows returned."</li>
                    </ol>
                  </div>
                </div>

                <Button className="w-full" asChild>
                  <a href="https://app.supabase.com/project/_/sql/new" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Supabase SQL Editor
                  </a>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step 3: Set Environment Variable */}
          <TabsContent value="step3" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">3</span>
                  Set DATABASE_URL in Vercel
                </CardTitle>
                <CardDescription>
                  Configure your environment variable for production
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-950 dark:border-blue-800">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      📍 Steps:
                    </p>
                    <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-2 list-decimal list-inside">
                      <li>Go to <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">vercel.com</a></li>
                      <li>Select your <strong>lenixmobile</strong> project</li>
                      <li>Click <strong>Settings</strong></li>
                      <li>Click <strong>Environment Variables</strong></li>
                      <li>Click <strong>Add New</strong></li>
                      <li>Set <strong>Name</strong> to: <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-xs">DATABASE_URL</code></li>
                      <li>Set <strong>Value</strong> to your connection string from Step 1</li>
                      <li>Select <strong>Production</strong> environment</li>
                      <li>Click <strong>Save</strong></li>
                    </ol>
                  </div>

                  <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                      After saving, Vercel will automatically redeploy your app with the new environment variable.
                    </AlertDescription>
                  </Alert>
                </div>

                <Button className="w-full" asChild>
                  <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Vercel Dashboard
                  </a>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step 4: Test & Login */}
          <TabsContent value="step4" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">4</span>
                  Test Connection & Login
                </CardTitle>
                <CardDescription>
                  Verify everything is working
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 dark:bg-green-950 dark:border-green-800">
                    <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
                      ✓ What to Do:
                    </p>
                    <ol className="text-sm text-green-800 dark:text-green-200 space-y-2 list-decimal list-inside">
                      <li>Wait 2-3 minutes for Vercel to redeploy</li>
                      <li>Go to your Vercel deployment URL</li>
                      <li>You should be redirected to the <strong>Login</strong> page</li>
                      <li>Click <strong>Settings</strong> in the sidebar</li>
                      <li>Scroll to <strong>Database Connection</strong></li>
                      <li>Click <strong>Test Connection</strong></li>
                      <li>You should see a <strong>green "Connected"</strong> status</li>
                    </ol>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-950 dark:border-blue-800">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      📍 Create Your First Account:
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                      Once the database is connected, you need to create an admin account:
                    </p>
                    <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-2 list-decimal list-inside">
                      <li>Go to <strong>/setup</strong> in your browser (e.g., your-app.vercel.app/setup)</li>
                      <li>Click <strong>Continue</strong> (database should show as connected)</li>
                      <li>Fill in your admin details (name, email, password)</li>
                      <li>Click <strong>Create Admin</strong></li>
                      <li>You'll be redirected to login</li>
                      <li>Sign in with your new credentials</li>
                      <li>You're now in the system! 🎉</li>
                    </ol>
                  </div>

                  <Alert className="bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800">
                    <CheckCircle2 className="h-4 w-4 text-purple-600" />
                    <AlertDescription className="text-purple-800 dark:text-purple-200">
                      Once logged in, go to <strong>Technicians</strong> to add your team members, then <strong>Repairs</strong> to start managing jobs!
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Troubleshooting */}
        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting</CardTitle>
            <CardDescription>Common issues and solutions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="border rounded-lg p-3">
                <p className="font-semibold text-sm mb-1">❌ "Database connection failed"</p>
                <p className="text-sm text-muted-foreground">Make sure you ran the SQL script in Step 2 and set DATABASE_URL in Step 3.</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="font-semibold text-sm mb-1">❌ "ENOTFOUND" error</p>
                <p className="text-sm text-muted-foreground">Your DATABASE_URL hostname is wrong. Copy it again from Supabase (Step 1).</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="font-semibold text-sm mb-1">❌ "Setup page shows 404"</p>
                <p className="text-sm text-muted-foreground">Wait for Vercel deployment to finish (check the Deployments tab). Then refresh your browser.</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="font-semibold text-sm mb-1">❌ "Can't create admin account"</p>
                <p className="text-sm text-muted-foreground">Make sure the database connection test passed first. If not, go back to Step 1-3.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-slate-500 dark:text-slate-400">
          <p>&copy; {new Date().getFullYear()} Lenix Mobile. All rights reserved.</p>
          <p className="mt-2">Need help? Check the GitHub repository or contact support.</p>
        </div>
      </div>
    </div>
  );
}
