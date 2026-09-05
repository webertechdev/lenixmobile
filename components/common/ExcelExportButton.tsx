"use client";

import { Download } from "lucide-react";
import * as XLSX from "xlsx";

type ExcelExportButtonProps = {
  data: Record<string, unknown>[];
  filename: string;
  sheetName?: string;
  label?: string;
};

export function ExcelExportButton({
  data,
  filename,
  sheetName = "Sheet1",
  label = "Export Excel",
}: ExcelExportButtonProps) {
  const handleExport = () => {
    if (!data.length) return;

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={!data.length}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
    >
      <Download className="h-4 w-4" />
      {label}
    </button>
  );
}