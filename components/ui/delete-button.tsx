"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DeleteButtonProps {
  endpoint: string;
  itemName: string;
  onDeleted?: () => void;
}

export function DeleteButton({ endpoint, itemName, onDeleted }: DeleteButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${itemName}?`)) return;

    setLoading(true);
    try {
      const response = await fetch(endpoint, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to delete ${itemName}`);
      }

      toast.success(`${itemName} deleted successfully`);
      if (onDeleted) {
        onDeleted();
      } else {
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="text-red-500 hover:text-red-700" 
      title="Delete"
      onClick={handleDelete}
      disabled={loading}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  );
}
