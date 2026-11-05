"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { AnalyticsRange } from "@/lib/analytics/admin";

interface AdminRangeSelectorProps {
  currentRange: AnalyticsRange;
}

const RANGES: Array<{ value: AnalyticsRange; label: string }> = [
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "12m", label: "Last 12 Months" },
];

export function AdminRangeSelector({ currentRange }: AdminRangeSelectorProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = (range: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    return params.toString();
  };

  return (
    <div className="flex items-center gap-1.5 p-1 bg-subtle rounded-xl border border-surface-border">
      {RANGES.map((r) => {
        const isActive = currentRange === r.value;
        return (
          <Link
            key={r.value}
            href={`${pathname}?${createQueryString(r.value)}`}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
              isActive
                ? "bg-surface text-copy-primary shadow-xs font-semibold"
                : "text-copy-muted hover:text-copy-primary hover:bg-surface/50"
            )}
          >
            {r.label}
          </Link>
        );
      })}
    </div>
  );
}
