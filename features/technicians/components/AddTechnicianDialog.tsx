"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Plus, Loader2, Shield, UserCheck, Wrench, Mail, AlertCircle } from "lucide-react";

export function AddTechnicianDialog({ onTechnicianAdded }: { onTechnicianAdded?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "",
    role: "technician",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setInviteStatus(null);

    try {
      const response = await fetch("/api/technicians/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create team member");
      }

      const roleLabel = formData.role === "admin" ? "Admin" : formData.role === "team_lead" ? "Team Lead" : "Technician";
      
      if (result.invited) {
        setInviteStatus(`✓ ${roleLabel} created and invitation sent to ${formData.email}`);
        toast.success(`Invitation sent to ${formData.email}`);
      } else if (result.error && !result.invitationSent) {
        setInviteStatus(`⚠ ${roleLabel} created but invitation failed: ${result.error}`);
        toast.error(`Profile created but invite failed: ${result.error}`);
      } else {
        setInviteStatus(`✓ ${roleLabel} profile created. User already exists in system.`);
        toast.success(`${roleLabel} profile created`);
      }

      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({ name: "", email: "", phone: "", specialization: "", role: "technician" });
        setInviteStatus(null);
        setOpen(false);
        onTechnicianAdded?.();
      }, 2000);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Team Member
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Team Member</DialogTitle>
          <DialogDescription>
            Create a new team member profile and send them an invitation email to set their password.
          </DialogDescription>
        </DialogHeader>

        {inviteStatus && (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
            <Mail className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              {inviteStatus}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address * (Invitation will be sent here)</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@lenix.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="0700000000"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialization">Specialization</Label>
            <Input
              id="specialization"
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              placeholder="e.g., Screen Replacement, Battery, Software"
            />
          </div>

          <div className="space-y-2">
            <Label>Role *</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technician">
                  <span className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-blue-500" />
                    Technician
                  </span>
                </SelectItem>
                <SelectItem value="team_lead">
                  <span className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-purple-500" />
                    Team Lead
                  </span>
                </SelectItem>
                <SelectItem value="admin">
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-red-500" />
                    Admin
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Admin: Full system access (1 allowed). Team Lead: Assigns repairs (1 allowed). Technician: Handles repairs.
            </p>
          </div>

          <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
            <Mail className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
              An invitation email will be sent to {formData.email || "[email address]"} with a link to set their password.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1" disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Sending Invite..." : "Create & Send Invite"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
