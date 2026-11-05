"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface ClubSearchBarProps {
  defaultValue?: string;
}

export function ClubSearchBar({ defaultValue = "" }: ClubSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = React.useState(defaultValue);

  React.useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (value.trim()) {
      params.set("q", value.trim());
    } else {
      params.delete("q");
    }
    params.delete("cursor");
    router.push(`/clubs?${params.toString()}`);
  };

  const handleClear = () => {
    setValue("");
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.delete("q");
    params.delete("cursor");
    router.push(`/clubs?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="relative flex items-center w-full max-w-md">
      <Search className="absolute left-3.5 size-4 text-copy-muted pointer-events-none" />
      <Input
        type="search"
        placeholder="Search active clubs by name..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-9 pr-16 h-10 rounded-xl border-surface-border bg-surface text-copy-primary focus-visible:ring-brand text-xs sm:text-sm"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleClear}
          aria-label="Clear search query"
          className="absolute right-8 size-6 text-copy-muted hover:text-copy-primary"
        >
          <X className="size-3.5" />
        </Button>
      )}
      <Button
        type="submit"
        size="sm"
        className="absolute right-1.5 h-7 px-2.5 rounded-lg bg-brand text-brand-foreground hover:bg-brand/90 text-xs font-medium"
      >
        Search
      </Button>
    </form>
  );
}
