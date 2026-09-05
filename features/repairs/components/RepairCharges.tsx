"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import {
  Loader2,
  PackagePlus,
  Plus,
  Trash2,
  Wrench,
} from "lucide-react";

import { toast } from "sonner";

export function RepairCharges({
  repairId,
}: {
  repairId: number;
}) {
  const router = useRouter();
  const [parts, setParts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [catalogue, setCatalogue] = useState<any[]>([]);

  const [partId, setPartId] = useState("");
  const [serviceId, setServiceId] = useState("");

  const [partQty, setPartQty] = useState("1");
  const [serviceQty, setServiceQty] = useState("1");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);

    try {
      const [
        chargesResponse,
        inventoryResponse,
        servicesResponse,
      ] = await Promise.all([
        fetch(`/api/repairs/${repairId}/charges`),
        fetch("/api/inventory"),
        fetch("/api/services"),
      ]);

      const charges = await chargesResponse.json();
      const inventoryData = await inventoryResponse.json();
      const servicesData = await servicesResponse.json();

      if (!chargesResponse.ok) {
        throw new Error(
          charges.error || "Failed to load repair charges"
        );
      }

      if (!inventoryResponse.ok) {
        throw new Error(
          inventoryData.error || "Failed to load inventory"
        );
      }

      if (!servicesResponse.ok) {
        throw new Error(
          servicesData.error || "Failed to load services"
        );
      }

      setParts(charges.parts || []);
      setServices(charges.services || []);

      setInventory(
        Array.isArray(inventoryData)
          ? inventoryData
          : []
      );

      setCatalogue(
        Array.isArray(servicesData)
          ? servicesData.filter(
              (service: any) => service.isActive
            )
          : []
      );
    } catch (error: any) {
      toast.error(
        error?.message || "Failed to load charges"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [repairId]);

  const partTotal = useMemo(() => {
    return parts.reduce(
      (sum, part) =>
        sum +
        Number(part.unitPrice || 0) *
          Number(part.quantity || 0),
      0
    );
  }, [parts]);

  const serviceTotal = useMemo(() => {
    return services.reduce(
      (sum, service) =>
        sum +
        Number(service.unitFee || 0) *
          Number(service.quantity || 0),
      0
    );
  }, [services]);

  const grandTotal = partTotal + serviceTotal;

  const add = async (
    type: "part" | "service"
  ) => {
    setSaving(true);

    try {
      const response = await fetch(
        `/api/repairs/${repairId}/charges`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type,

            ...(type === "part"
              ? {
                  partId: Number(partId),
                  quantity: Number(partQty),
                }
              : {
                  serviceId: Number(serviceId),
                  quantity: Number(serviceQty),
                }),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to add charge"
        );
      }

      toast.success(
        type === "part"
          ? "Part added to repair"
          : "Service fee added to repair"
      );

      if (type === "part") {
        setPartId("");
        setPartQty("1");
      } else {
        setServiceId("");
        setServiceQty("1");
      }

      await load();
      router.refresh();
    } catch (error: any) {
      toast.error(
        error?.message || "Failed to add charge"
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (
    type: "part" | "service",
    id: number
  ) => {
    try {
      const response = await fetch(
        `/api/repairs/${repairId}/charges`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type,
            id,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to remove item"
        );
      }

      toast.success(
        type === "part"
          ? "Part removed and stock restored"
          : "Service fee removed"
      );

      await load();
      router.refresh();
    } catch (error: any) {
      toast.error(
        error?.message || "Failed to remove item"
      );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Services & Parts
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">

        {/* SERVICE FEES */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center gap-2 font-semibold">
            <Wrench className="h-4 w-4" />
            Add Service Fee
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_100px_auto]">

            <Select
              value={serviceId}
              onValueChange={setServiceId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>

              <SelectContent>
                {catalogue.map((service) => (
                  <SelectItem
                    key={service.id}
                    value={String(service.id)}
                  >
                    {service.name} — KSh{" "}
                    {Number(service.fee).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              min="1"
              value={serviceQty}
              onChange={(event) =>
                setServiceQty(event.target.value)
              }
            />

            <Button
              type="button"
              disabled={!serviceId || saving}
              onClick={() => add("service")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>

          </div>
        </div>

        {/* INVENTORY PARTS */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center gap-2 font-semibold">
            <PackagePlus className="h-4 w-4" />
            Add Inventory Part
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_100px_auto]">

            <Select
              value={partId}
              onValueChange={setPartId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a part" />
              </SelectTrigger>

              <SelectContent>
                {inventory
                  .filter(
                    (part) =>
                      Number(part.quantity) > 0
                  )
                  .map((part) => (
                    <SelectItem
                      key={part.id}
                      value={String(part.id)}
                    >
                      {part.partName} — Stock{" "}
                      {part.quantity} — KSh{" "}
                      {Number(
                        part.unitPrice
                      ).toFixed(2)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              min="1"
              value={partQty}
              onChange={(event) =>
                setPartQty(event.target.value)
              }
            />

            <Button
              type="button"
              disabled={!partId || saving}
              onClick={() => add("part")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>

          </div>
        </div>

        {/* CHARGES */}
        <div className="grid gap-6 md:grid-cols-2">

          {/* SERVICES */}
          <div className="space-y-2">
            <h3 className="font-semibold">
              Service Fees
            </h3>

            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No service fees added.
              </p>
            ) : (
              services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between rounded border p-2 text-sm"
                >
                  <span>
                    {service.serviceName} ×{" "}
                    {service.quantity}
                  </span>

                  <span className="flex items-center gap-3">
                    <b>
                      KSh{" "}
                      {(
                        Number(service.unitFee) *
                        Number(service.quantity)
                      ).toFixed(2)}
                    </b>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        remove(
                          "service",
                          service.id
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </span>
                </div>
              ))
            )}

            <div className="border-t pt-2 flex justify-between font-bold">
              <span>
                Services Total
              </span>

              <span>
                KSh {serviceTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* PARTS */}
          <div className="space-y-2">
            <h3 className="font-semibold">
              Parts Used
            </h3>

            {parts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No parts added.
              </p>
            ) : (
              parts.map((part) => (
                <div
                  key={part.id}
                  className="flex items-center justify-between rounded border p-2 text-sm"
                >
                  <span>
                    {part.partName} ×{" "}
                    {part.quantity}
                  </span>

                  <span className="flex items-center gap-3">
                    <b>
                      KSh{" "}
                      {(
                        Number(part.unitPrice) *
                        Number(part.quantity)
                      ).toFixed(2)}
                    </b>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        remove(
                          "part",
                          part.id
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </span>
                </div>
              ))
            )}

            <div className="border-t pt-2 flex justify-between font-bold">
              <span>
                Parts Total
              </span>

              <span>
                KSh {partTotal.toFixed(2)}
              </span>
            </div>
          </div>

        </div>

        {/* GRAND TOTAL */}
        <div className="rounded-lg bg-muted p-4 flex justify-between text-lg font-bold">
          <span>
            Repair Total
          </span>

          <span>
            KSh {grandTotal.toFixed(2)}
          </span>
        </div>

      </CardContent>
    </Card>
  );
}