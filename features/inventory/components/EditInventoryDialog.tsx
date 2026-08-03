"use client";

import { useState, useEffect } from "react";
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
import { toast } from "sonner";
import { Loader2, Edit } from "lucide-react";
import { useRouter } from "next/navigation";

export function EditInventoryDialog({ 
  item, 
  onItemUpdated 
}: { 
  item: any, 
  onItemUpdated?: () => void 
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [formData, setFormData] = useState({
    partName: item.partName || "",
    partCode: item.partCode || "",
    quantity: item.quantity || 0,
    minimumStock: item.minimumStock || 5,
    unitPrice: item.unitPrice || "0.00",
    supplier: item.supplier || "",
    category: item.category || "",
  });

  useEffect(() => {
    if (open) {
      setFormData({
        partName: item.partName || "",
        partCode: item.partCode || "",
        quantity: item.quantity || 0,
        minimumStock: item.minimumStock || 5,
        unitPrice: item.unitPrice || "0.00",
        supplier: item.supplier || "",
        category: item.category || "",
      });
    }
  }, [open, item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/inventory/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity.toString()),
          minimumStock: parseInt(formData.minimumStock.toString()),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update item");
      }

      toast.success("Inventory item updated successfully");
      setOpen(false);
      if (onItemUpdated) {
        onItemUpdated();
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Edit">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Inventory Item</DialogTitle>
          <DialogDescription>
            Update stock details for {item.partName}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inv-name">Part Name *</Label>
            <Input
              id="inv-name"
              value={formData.partName}
              onChange={(e) => setFormData({ ...formData, partName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inv-code">Part Code</Label>
            <Input
              id="inv-code"
              value={formData.partCode}
              onChange={(e) => setFormData({ ...formData, partCode: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inv-qty">Quantity *</Label>
              <Input
                id="inv-qty"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-min">Min. Stock *</Label>
              <Input
                id="inv-min"
                type="number"
                value={formData.minimumStock}
                onChange={(e) => setFormData({ ...formData, minimumStock: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inv-price">Unit Price ($) *</Label>
            <Input
              id="inv-price"
              type="text"
              value={formData.unitPrice}
              onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inv-supplier">Supplier</Label>
              <Input
                id="inv-supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-cat">Category</Label>
              <Input
                id="inv-cat"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1" disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Updating..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
