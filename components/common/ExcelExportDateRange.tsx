"use client";

import { useState } from "react";
import { Download } from "lucide-react";

type ExcelExportDateRangeProps = {
  disabled?: boolean;
};

export function ExcelExportDateRange({
  disabled = false,
}: ExcelExportDateRangeProps) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");

  const handleExport = async () => {
    setError("");

    if (from && to && from > to) {
      setError("Export From date must be on or before Export To date.");
      return;
    }

    try {
      setIsExporting(true);

      const params = new URLSearchParams();

      if (from) {
        params.set("from", from);
      }

      if (to) {
        params.set("to", to);
      }

      const response = await fetch(
        `/api/repairs/export?${params.toString()}`,
        {
          method: "GET",
        },
      );

      if (!response.ok) {
        let message = "Failed to export repairs.";

        try {
          const data = await response.json();

          if (data?.error) {
            message = data.error;
          }
        } catch {
          // Keep the default error message.
        }

        throw new Error(message);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;

      const filename =
        from && to
          ? `repairs-${from}-to-${to}.xlsx`
          : from
            ? `repairs-from-${from}.xlsx`
            : to
              ? `repairs-to-${to}.xlsx`
              : "repairs.xlsx";

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (exportError) {
      console.error("Repair export failed:", exportError);

      setError(
        exportError instanceof Error
          ? exportError.message
          : "Failed to export repairs.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="export-from"
          className="text-xs font-medium text-muted-foreground"
        >
          Export From
        </label>

        <input
          id="export-from"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          disabled={isExporting || disabled}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="export-to"
          className="text-xs font-medium text-muted-foreground"
        >
          Export To
        </label>

        <input
          id="export-to"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          disabled={isExporting || disabled}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        />
      </div>

      <button
        type="button"
        disabled={disabled || isExporting}
        onClick={handleExport}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        {isExporting ? "Exporting..." : "Export Excel"}
      </button>

      {error && (
        <p className="w-full text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}