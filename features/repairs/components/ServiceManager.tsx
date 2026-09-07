"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import {
  Pencil,
  Loader2,
  Power,
} from "lucide-react";

import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { TablePagination } from "@/components/common/TablePagination";

type ServiceForm = {
  name: string;
  code: string;
  category: string;
  description: string;
  fee: string;
  isActive: boolean;
};

const emptyForm: ServiceForm = {
  name: "",
  code: "",
  category: "",
  description: "",
  fee: "0.00",
  isActive: true,
};

export function ServiceManager() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] =
    useState<ServiceForm>(emptyForm);

  const [editing, setEditing] =
    useState<number | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);
  const searchParams = useSearchParams();
  const pageSize = [5, 50, 100].includes(Number(searchParams.get("pageSize")))
    ? Number(searchParams.get("pageSize"))
    : 5;
  const page = Number(searchParams.get("page")) > 0 ? Number(searchParams.get("page")) : 1;
  const [totalItems, setTotalItems] = useState(0);

  const load = async () => {
    setLoading(true);

    try {
      const response =
        await fetch(`/api/services?page=${page}&pageSize=${pageSize}`);

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to load services"
        );
      }

      setItems(
        Array.isArray(data)
          ? data
          : []
      );
          setTotalItems(Number(response.headers.get("X-Total-Count") || data.length));
    } catch (error: any) {
      toast.error(
        error?.message ||
          "Failed to load services"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [searchParams]);

  const save = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setSaving(true);

    try {
      const url = editing
        ? `/api/services/${editing}`
        : "/api/services";

      const method = editing
        ? "PATCH"
        : "POST";

      const response =
        await fetch(url, {
          method,
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: form.name,
            code: form.code,
            category: form.category,
            description:
              form.description,
            fee: form.fee,
            isActive:
              form.isActive,
          }),
        });

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to save service"
        );
      }

      toast.success(
        editing
          ? "Service updated"
          : "Service created"
      );

      setForm(emptyForm);
      setEditing(null);

      await load();
    } catch (error: any) {
      toast.error(
        error?.message ||
          "Failed to save service"
      );
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (
    item: any
  ) => {
    setEditing(item.id);

    setForm({
      name: item.name || "",
      code: item.code || "",
      category:
        item.category || "",
      description:
        item.description || "",
      fee:
        item.fee !== null &&
        item.fee !== undefined
          ? String(item.fee)
          : "0.00",
      isActive:
        item.isActive !== false,
    });
  };

  const cancelEditing = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const toggle = async (
    item: any
  ) => {
    try {
      const response =
        await fetch(
          `/api/services/${item.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              isActive:
                !item.isActive,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to update service"
        );
      }

      toast.success(
        item.isActive
          ? "Service deactivated"
          : "Service activated"
      );

      await load();
    } catch (error: any) {
      toast.error(
        error?.message ||
          "Failed to update service"
      );
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">

      {/* FORM */}
      <Card>
        <CardHeader>
          <CardTitle>
            {editing
              ? "Edit Service"
              : "Add Service"}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={save}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="service-name">
                Name *
              </Label>

              <Input
                id="service-name"
                value={form.name}
                onChange={(event) =>
                  setForm({
                    ...form,
                    name:
                      event.target
                        .value,
                  })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-code">
                Service Code
              </Label>

              <Input
                id="service-code"
                value={form.code}
                onChange={(event) =>
                  setForm({
                    ...form,
                    code:
                      event.target
                        .value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-category">
                Category
              </Label>

              <Input
                id="service-category"
                value={form.category}
                onChange={(event) =>
                  setForm({
                    ...form,
                    category:
                      event.target
                        .value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-description">
                Description
              </Label>

              <Input
                id="service-description"
                value={
                  form.description
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    description:
                      event.target
                        .value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-fee">
                Fee (KSh) *
              </Label>

              <Input
                id="service-fee"
                type="number"
                min="0"
                step="0.01"
                value={form.fee}
                onChange={(event) =>
                  setForm({
                    ...form,
                    fee:
                      event.target
                        .value,
                  })
                }
                required
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={saving}
                className="flex-1"
              >
                {saving && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}

                {editing
                  ? "Save Changes"
                  : "Add Service"}
              </Button>

              {editing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={
                    cancelEditing
                  }
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* CATALOGUE */}
      <Card>
        <CardHeader>
          <CardTitle>
            Service Fee Catalogue
          </CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">

              {items.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No services configured
                  yet.
                </p>
              )}

              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="font-medium">
                      {item.name}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {item.category ||
                        "Uncategorised"}

                      {item.code &&
                        ` • ${item.code}`}
                    </div>

                    {item.description && (
                      <div className="mt-1 text-sm text-muted-foreground">
                        {
                          item.description
                        }
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-semibold whitespace-nowrap">
                      KSh{" "}
                      {Number(
                        item.fee
                      ).toFixed(2)}
                    </span>

                    <Badge
                      variant={
                        item.isActive
                          ? "outline"
                          : "secondary"
                      }
                    >
                      {item.isActive
                        ? "Active"
                        : "Inactive"}
                    </Badge>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Edit service"
                      onClick={() =>
                        startEditing(
                          item
                        )
                      }
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title={
                        item.isActive
                          ? "Deactivate service"
                          : "Activate service"
                      }
                      onClick={() =>
                        toggle(item)
                      }
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <TablePagination page={Math.min(page, Math.max(1, Math.ceil(totalItems / pageSize)))} pageSize={pageSize} totalItems={totalItems} />

            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}