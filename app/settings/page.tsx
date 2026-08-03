"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, Save, Shield, Database, Bell, Loader2, CheckCircle2, User } from "lucide-react";
import { DatabaseStatus } from "@/features/settings/components/DatabaseStatus";
import { AdminSetupPanel } from "@/features/settings/components/AdminSetupPanel";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export default function SettingsPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUserEmail(user.email || "");
          
          // Fetch user role from database
          const response = await fetch("/api/auth/sync-user", { method: "POST" });
          const data = await response.json();
          if (data.user) {
            setUserRole(data.user.role);
            setUserName(data.user.name || "");
          }
        }
      } catch (error) {
        console.error("Error checking user role:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [supabase]);

  const handlePromoteToAdmin = async () => {
    try {
      setPromoting(true);
      const response = await fetch("/api/admin/promote-me", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to promote to admin");
        return;
      }

      setUserRole("admin");
      toast.success("Successfully promoted to admin!");
      
      // Refresh the page after a short delay
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setPromoting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure your system preferences</p>
      </div>

      <div className="grid gap-6">
        {/* User Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Your Profile</CardTitle>
            </div>
            <CardDescription>Your account information and role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Name</p>
                <p className="font-medium text-lg">{userName || "Loading..."}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p className="font-medium">{userEmail || "Loading..."}</p>
              </div>
            </div>
            {userRole && (
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Role:</span>
                <Badge variant={userRole === "admin" ? "default" : "secondary"} className="capitalize">
                  {userRole}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <CardTitle>General Configuration</CardTitle>
            </div>
            <CardDescription>Basic system information and display settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="shopName">Shop Name</Label>
              <Input id="shopName" defaultValue="Lenix Mobile" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currency">Currency Code</Label>
              <Input id="currency" defaultValue="KES" />
            </div>
            <Button className="w-fit">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* User Role Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>User Role & Permissions</CardTitle>
            </div>
            <CardDescription>Manage your account permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Current Role</p>
                  <p className="text-lg font-bold capitalize text-slate-900 dark:text-white mt-1">
                    {userRole || "Unknown"}
                  </p>
                </div>

                {userRole === "admin" ? (
                  <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      You have admin access. You can create technicians, manage repairs, view audit logs, and configure the system.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800">
                      <Bell className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                        You don't have admin permissions yet. Click the button below to promote yourself to admin.
                      </AlertDescription>
                    </Alert>
                    <Button
                      onClick={handlePromoteToAdmin}
                      disabled={promoting}
                      className="w-full"
                      variant="default"
                    >
                      {promoting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Promoting...
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-4 w-4" />
                          Make Me Admin
                        </>
                      )}
                    </Button>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <DatabaseStatus />

        {userRole === "admin" && <AdminSetupPanel />}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle>Data & Backup</CardTitle>
            </div>
            <CardDescription>Manage your data exports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
              <div>
                <p className="font-medium">Export All Data</p>
                <p className="text-sm text-muted-foreground">Download a full backup in CSV format</p>
              </div>
              <Button variant="outline">Export CSV</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
