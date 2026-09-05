"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type RefreshButtonProps = {
  label?: string;
  className?: string;
};

export function RefreshButton({
  label = "Refresh",
  className = "",
}: RefreshButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    if (loading) return;

    setLoading(true);
    router.refresh();

    // Give the user visible feedback while the server refreshes.
    window.setTimeout(() => {
      setLoading(false);
    }, 800);
  };

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={loading}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 ${className}`}
    >
      <RefreshCw
        className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
      />
      {loading ? "Refreshing..." : label}
    </button>
  );
}