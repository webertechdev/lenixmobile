"use client";

import { Loader2 } from "lucide-react";

type LoadingIndicatorProps = {
  text?: string;
  className?: string;
};

export function LoadingIndicator({
  text = "Loading...",
  className = "",
}: LoadingIndicatorProps) {
  return (
    <div
      className={`flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground ${className}`}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{text}</span>
    </div>
  );
}