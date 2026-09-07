import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/40 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
