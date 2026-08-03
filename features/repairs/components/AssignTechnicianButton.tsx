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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserCheck, Loader2 } from "lucide-react";

interface AssignTechnicianButtonProps {
  repairId: number;
  technicians: any[];
  currentTechnicianId: number | null;
}

export function AssignTechnicianButton({ repairId, technicians, currentTechnicianId }: AssignTechnicianButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTechId, setSelectedTechId] = useState<string>(currentTechnicianId?.toString() || "");

  const handleAssign = async () => {
    if (!selectedTechId) {
      toast.error("Please select a technician");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/repairs/${repairId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicianId: parseInt(selectedTechId) }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to assign technician");
      }

      toast.success("Technician assigned successfully!");
      setOpen(false);
      // Refresh page to show updated assignment
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
          <UserCheck className="h-3 w-3 mr-1" />
          Assign
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign Technician</DialogTitle>
          <DialogDescription>
            Assign this repair to a team member. Admins and Team Leads can assign work.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={selectedTechId} onValueChange={setSelectedTechId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a technician" />
            </SelectTrigger>
            <SelectContent>
              {technicians.filter(t => t.role !== 'admin').map((tech: any) => (
                <SelectItem key={tech.id} value={tech.id.toString()}>
                  <span className="flex items-center gap-2">
                    {tech.name} — {tech.specialization || 'Generalist'}
                    {tech.role === 'team_lead' && (
                      <span className="text-xs text-purple-500">(Lead)</span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={loading || !selectedTechId} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Assigning..." : "Assign"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
