"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, CheckCircle2, AlertCircle, Database, Shield, 
  Mail, Settings, Copy, RefreshCw, Trash2 
} from "lucide-react";
import { toast } from "sonner";

export function AdminSetupPanel() {
  const [loading, setLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [setupResults, setSetupResults] = useState<any>(null);

  const fetchDiagnostics = async () => {
    try {
      const response = await fetch("/api/admin/diagnostics");
      const data = await response.json();
      setDiagnostics(data);
    } catch (err) {
      console.error("Failed to fetch diagnostics", err);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  const handleRunMigrations = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/setup/run-migrations", {
        method: "POST",
      });
      const data = await response.json();
      setSetupResults(data);
      if (data.success) {
        toast.success("Database setup completed!");
        fetchDiagnostics();
      } else {
        toast.error(data.error || "Setup failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to run setup");
    } finally {
      setLoading(false);
    }
  };

  const copySql = () => {
    const sql = `CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;`;
    navigator.clipboard.writeText(sql);
    toast.success("SQL copied to clipboard!");
  };

  if (!diagnostics) return null;

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Admin Setup Tools</CardTitle>
          </div>
          <CardDescription>
            System configuration and database management tools (Admin Only)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* System Status */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg border bg-slate-50 dark:bg-slate-900">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Invitation System
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Service Role Key</span>
                  {diagnostics.env.SUPABASE_SERVICE_ROLE_KEY ? (
                    <Badge variant="default" className="bg-green-600">Configured</Badge>
                  ) : (
                    <Badge variant="destructive">Missing</Badge>
                  )}
                </div>
                {!diagnostics.env.SUPABASE_SERVICE_ROLE_KEY && (
                  <p className="text-[10px] text-red-500 mt-1">
                    Emails cannot be sent without the SUPABASE_SERVICE_ROLE_KEY.
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-slate-50 dark:bg-slate-900">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Role Hierarchy
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1 uppercase font-bold">In Users Table</p>
                  <div className="flex justify-between">
                    <span>Admins</span>
                    <span className={diagnostics.hierarchy.users.admins > 1 ? "text-red-500 font-bold" : ""}>
                      {diagnostics.hierarchy.users.admins} / 1
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Team Leads</span>
                    <span className={diagnostics.hierarchy.users.teamLeads > 1 ? "text-red-500 font-bold" : ""}>
                      {diagnostics.hierarchy.users.teamLeads} / 1
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-[10px] text-muted-foreground mb-1 uppercase font-bold">In Technicians Table</p>
                  <div className="flex justify-between">
                    <span>Admins</span>
                    <span className={diagnostics.hierarchy.technicians.admins > 1 ? "text-red-500 font-bold" : ""}>
                      {diagnostics.hierarchy.technicians.admins} / 1
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Team Leads</span>
                    <span className={diagnostics.hierarchy.technicians.teamLeads > 1 ? "text-red-500 font-bold" : ""}>
                      {diagnostics.hierarchy.technicians.teamLeads} / 1
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Database Setup */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database Migrations
            </h3>
            
            <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800 dark:text-blue-200">Migration Helper</AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-300 text-xs">
                Run this to ensure your database has all the latest columns for the invitation system.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button 
                onClick={handleRunMigrations} 
                disabled={loading}
                className="flex-1"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Run Database Setup
              </Button>
            </div>

            {setupResults && (
              <div className={`p-4 rounded-lg border space-y-3 ${setupResults.success && !setupResults.error ? 'border-green-200 bg-green-50 dark:bg-green-950/20' : 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20'}`}>
                <div className="flex items-center gap-2">
                  {setupResults.success && !setupResults.error ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className="text-sm font-semibold">
                    {setupResults.success && !setupResults.error ? 'Setup Successful' : 'Setup Finished with Warnings'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {setupResults.message}
                </p>
                {setupResults.error && (
                  <p className="text-[10px] text-red-500">
                    Last Error: {setupResults.error}
                  </p>
                )}
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-600 dark:text-slate-400">
                    If you still face issues, you can run the full schema fix manually in your Supabase SQL Editor:
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full text-xs"
                    onClick={() => {
                      const sql = `-- Run this in Supabase SQL Editor to fix common schema issues
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE technicians DISABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role') THEN
        CREATE TYPE public.role AS ENUM ('admin', 'team_lead', 'technician', 'viewer');
    END IF;
END $$;
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS role public.role DEFAULT 'technician';
ALTER TABLE technicians ALTER COLUMN user_id DROP NOT NULL;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invitation_status') THEN
        CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired');
    END IF;
END $$;
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS invitation_status public.invitation_status DEFAULT 'pending';
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS invitation_sent_at timestamp;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;`;
                      navigator.clipboard.writeText(sql);
                      toast.success("Manual SQL copied to clipboard!");
                    }}
                  >
                    <Copy className="mr-2 h-3 w-3" />
                    Copy Manual Fix SQL
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Hierarchy Cleanup */}
          {(diagnostics.hierarchy.users.admins > 1 || 
            diagnostics.hierarchy.users.teamLeads > 1 || 
            diagnostics.hierarchy.technicians.admins > 1 || 
            diagnostics.hierarchy.technicians.teamLeads > 1) && (
            <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 space-y-3">
              <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-semibold">Hierarchy Issues Detected</span>
              </div>
              <p className="text-xs text-yellow-600 dark:text-yellow-300">
                The system detected multiple Admins or Team Leads. This violates the 1 Admin / 1 Team Lead rule.
              </p>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                onClick={async () => {
                  try {
                    const response = await fetch("/api/admin/cleanup-hierarchy", { method: "POST" });
                    const data = await response.json();
                    if (data.success) {
                      toast.success(data.message);
                      fetchDiagnostics();
                    } else {
                      toast.error(data.error || "Cleanup failed");
                    }
                  } catch (err: any) {
                    toast.error(err.message);
                  }
                }}
              >
                <Trash2 className="mr-2 h-3 w-3" />
                Fix Duplicates
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
