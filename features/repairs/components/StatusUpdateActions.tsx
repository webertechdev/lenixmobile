"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Package, Wrench, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface StatusUpdateActionsProps {
  repairId: number;
  currentStatus: string;
}

export function StatusUpdateActions({ repairId, currentStatus }: StatusUpdateActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const updateStatus = async (newStatus: string) => {
    if (newStatus === currentStatus) return;
    
    setLoading(newStatus);
    try {
      const response = await fetch(`/api/repairs/${repairId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update status");
      }

      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(null);
    }
  };

  const statuses = [
    { id: 'open', label: 'Open', icon: CheckCircle },
    { id: 'in_progress', label: 'In Progress', icon: Wrench },
    { id: 'waiting_parts', label: 'Waiting Parts', icon: Package },
    { id: 'quality_check', label: 'QA Check', icon: CheckCircle, iconColor: 'text-purple-600' },
    { id: 'completed', label: 'Completed', icon: CheckCircle, iconColor: 'text-green-600' },
    { id: 'returned', label: 'Returned', icon: CheckCircle, iconColor: 'text-gray-600' },
    { id: 'cancelled', label: 'Cancelled', icon: CheckCircle, iconColor: 'text-red-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2">
      {statuses.map((status) => {
        const Icon = status.icon;
        return (
          <Button 
            key={status.id}
            variant={currentStatus === status.id ? 'default' : 'outline'} 
            size="sm"
            className="h-auto py-2 text-xs"
            disabled={loading !== null}
            onClick={() => updateStatus(status.id)}
          >
            {loading === status.id ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icon className={`mr-2 h-4 w-4 ${status.iconColor || ''}`} />
            )}
            {status.label}
          </Button>
        );
      })}
    </div>
  );
}
