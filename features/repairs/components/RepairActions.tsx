"use client";

import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface RepairActionsProps {
  repairId: number;
  repairNumber: string;
}

export function RepairActions({ repairId, repairNumber }: RepairActionsProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete repair ${repairNumber}?`)) return;

    try {
      const response = await fetch(`/api/repairs/${repairId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete repair");
      }

      toast.success(`Repair ${repairNumber} deleted successfully`);
      // Use router.refresh() if on the list page, or redirect if on detail page
      router.refresh();
      // If we are on the detail page, we should redirect
      if (window.location.pathname.includes(`/repairs/${repairId}`)) {
        router.push("/repairs");
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Link href={`/repairs/${repairId}/edit`}>
        <Button variant="ghost" size="sm" title="Edit">
          <Edit className="h-4 w-4" />
        </Button>
      </Link>
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-red-500 hover:text-red-700" 
        title="Delete"
        onClick={handleDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
