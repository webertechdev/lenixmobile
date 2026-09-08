"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type SearchInputProps = {
  value?: string;
  placeholder?: string;
  className?: string;
};

export function SearchInput({
  value = "",
  placeholder = "Search...",
  className = "",
}: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(value);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (normalizedQuery === (value || "").trim()) return;

    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (normalizedQuery) params.set("q", normalizedQuery);
      else params.delete("q");
      params.set("page", "1");
      router.replace(`${pathname}?${params.toString()}`);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [pathname, query, router, searchParams, value]);

  return (
    <div className={`relative w-full md:w-80 ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
    </div>
  );
}
