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
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export function AddInventoryDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [formData, setFormData] = useState({
    partName: "",
    partCode: "",
    quantity: 0,
    minimumStock: 5,
    unitPrice: "0.00",
    supplier: "",
    category: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to add inventory item");
      }

      toast.success("Inventory item added successfully");
      setOpen(false);
      setFormData({ partName: "", partCode: "", quantity: 0, minimumStock: 5, unitPrice: "0.00", supplier: "", category: "" });
      router.refresh();
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
          Add Part
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Spare Part</DialogTitle>
          <DialogDescription>
            Add a new item to the inventory stock.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-inv-name">Part Name *</Label>
            <Input
              id="new-inv-name"
              value={formData.partName}
              onChange={(e) => setFormData({ ...formData, partName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-inv-code">Part Code</Label>
            <Input
              id="new-inv-code"
              value={formData.partCode}
              onChange={(e) => setFormData({ ...formData, partCode: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-inv-qty">Initial Quantity *</Label>
              <Input
                id="new-inv-qty"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-inv-min">Min. Stock Alert *</Label>
              <Input
                id="new-inv-min"
                type="number"
                value={formData.minimumStock}
                onChange={(e) => setFormData({ ...formData, minimumStock: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-inv-price">Unit Price ($) *</Label>
            <Input
              id="new-inv-price"
              type="text"
              value={formData.unitPrice}
              onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-inv-supplier">Supplier</Label>
              <Input
                id="new-inv-supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-inv-cat">Category</Label>
              <Input
                id="new-inv-cat"
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
              {loading ? "Adding..." : "Add to Inventory"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
