"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { User, Phone, Briefcase, Database, Wrench, Shield, UserCheck, Trash2, Edit, Mail } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { AddTechnicianDialog } from "@/features/technicians/components/AddTechnicianDialog";
import { EditTechnicianDialog } from "@/features/technicians/components/EditTechnicianDialog";

export default function TechniciansPage() {
  const [allTechs, setAllTechs] = useState<any[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentUserRole();
    fetchTechnicians();
  }, []);

  const fetchCurrentUserRole = async () => {
    try {
      const response = await fetch("/api/auth/sync-user", { method: "POST" });
      const data = await response.json();
      if (data.user?.role) {
        setCurrentUserRole(data.user.role);
      }
    } catch (err) {
      // Silently fail
    }
  };

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/technicians");
      const data = await response.json();
      
      if (response.ok && Array.isArray(data)) {
        setAllTechs(data);
      } else if (!response.ok) {
        setError(data.error || "Failed to load technicians");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load technicians");
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvite = async (email: string) => {
    try {
      toast.info(`Resending invitation to ${email}...`);
      const response = await fetch("/api/technicians/resend-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error("Failed to parse server response");
      }

      if (!response.ok) {
        toast.error(data?.error || "Failed to resend invitation");
        return;
      }

      toast.success(data?.message || "Invitation resent successfully!");
      fetchTechnicians();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    
    try {
      const response = await fetch(`/api/technicians/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete technician");
      }
      
      toast.success("Technician deleted successfully");
      fetchTechnicians();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800";
      case "team_lead":
        return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800";
      case "technician":
        return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800";
      case "viewer":
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <Shield className="h-3 w-3 text-red-500" />;
      case "team_lead": return <UserCheck className="h-3 w-3 text-purple-500" />;
      default: return <Wrench className="h-3 w-3 text-blue-500" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "Admin";
      case "team_lead": return "Team Lead";
      case "viewer": return "Viewer";
      default: return "Technician";
    }
  };

  const getInvitationStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800";
      case "expired":
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getInvitationStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending Invite";
      case "accepted":
        return "Active";
      case "expired":
        return "Invite Expired";
      default:
        return "Unknown";
    }
  };

  const canDelete = (tech: any) => {
    // Only admin can delete team leads and admins; team lead can delete technicians
    if (currentUserRole === "admin") return true;
    if (currentUserRole === "team_lead" && tech.role !== "admin" && tech.role !== "team_lead") return true;
    return false;
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground">Manage roles and permissions — 1 Admin, 1 Team Lead, Many Technicians</p>
        </div>
        {/* RESTORED: Only Admin can add team members */}
        {currentUserRole === "admin" && (
          <AddTechnicianDialog onTechnicianAdded={fetchTechnicians} />
        )}
      </div>

      {/* Team Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950">
              <Shield className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{allTechs.filter(t => t.role === "admin").length}</p>
              <p className="text-sm text-muted-foreground">Admin (Max 1)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950">
              <UserCheck className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{allTechs.filter(t => t.role === "team_lead").length}</p>
              <p className="text-sm text-muted-foreground">Team Lead (Max 1)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950">
              <Wrench className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{allTechs.filter(t => t.role === "technician").length}</p>
              <p className="text-sm text-muted-foreground">Technicians</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert className="bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800">
          <Database className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Team Members ({allTechs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : allTechs.length > 0 ? (
                  allTechs.map((tech) => (
                    <TableRow key={tech.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {tech.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-3 w-3 text-muted-foreground" />
                          {tech.specialization || "Generalist"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {tech.phone || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={getRoleBadgeColor(tech.role)}
                        >
                          {getRoleIcon(tech.role)}
                          <span className="ml-1">{getRoleLabel(tech.role)}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={tech.invitationStatus === "accepted" ? "default" : "secondary"}
                          className={getInvitationStatusColor(tech.invitationStatus)}
                        >
                          {getInvitationStatusLabel(tech.invitationStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {currentUserRole === "admin" && tech.invitationStatus !== "accepted" && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              title="Resend Invitation"
                              onClick={() => handleResendInvite(tech.email)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
	                          {currentUserRole === "admin" && (
	                            <EditTechnicianDialog technician={tech} onTechnicianUpdated={fetchTechnicians} />
	                          )}
	                          {canDelete(tech) && (
	                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-500 hover:text-red-700" 
                                title="Delete"
                                onClick={() => handleDelete(tech.id, tech.name)}
                              >
	                              <Trash2 className="h-4 w-4" />
	                            </Button>
	                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : !error && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <Wrench className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      No team members found. Click "Add Team Member" to create your first team member.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
