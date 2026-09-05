"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type TablePaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
};

export function TablePagination({
  page,
  pageSize,
  totalItems,
}: TablePaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  const updatePagination = (newPage: number, newPageSize: number) => {
    const params = new URLSearchParams(searchParams.toString());

    params.set("page", String(newPage));
    params.set("pageSize", String(newPageSize));

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Show</span>

        <select
          value={pageSize}
          onChange={(event) => {
            updatePagination(1, Number(event.target.value));
          }}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          aria-label="Items per page"
        >
          <option value={5}>5</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>

        <span>per page</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => updatePagination(page - 1, pageSize)}
          disabled={!canGoPrevious}
          className="inline-flex h-9 items-center gap-1 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        <span className="min-w-[110px] text-center text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>

        <button
          type="button"
          onClick={() => updatePagination(page + 1, pageSize)}
          disabled={!canGoNext}
          className="inline-flex h-9 items-center gap-1 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}