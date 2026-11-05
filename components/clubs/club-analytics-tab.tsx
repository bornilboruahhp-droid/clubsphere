"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ClubAnalyticsData,
  ClubAnalyticsRange,
} from "@/lib/analytics/club";
import { ClubAnalyticsStatCards } from "@/components/clubs/club-analytics-stat-cards";
import { ClubAnalyticsCharts } from "@/components/clubs/club-analytics-charts";
import { ClubAnalyticsEventsTable } from "@/components/clubs/club-analytics-events-table";
import { ClubAnalyticsParticipation } from "@/components/clubs/club-analytics-participation";
import { ClubAnalyticsElectionHistory } from "@/components/clubs/club-analytics-election-history";

interface ClubAnalyticsTabProps {
  clubId: string;
  data: ClubAnalyticsData;
}

const RANGES: Array<{ value: ClubAnalyticsRange; label: string }> = [
  { value: "90d", label: "Last 90 Days" },
  { value: "12m", label: "Last 12 Months" },
  { value: "all", label: "All Time" },
];

export function ClubAnalyticsTab({ clubId, data }: ClubAnalyticsTabProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentRange = data.range.range;

  const createQueryString = (range: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "analytics");
    params.set("range", range);
    return params.toString();
  };

  return (
    <div className="space-y-8">
      {/* Tab Header & Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h2 className="text-base font-semibold text-copy-primary">
            Club Performance Analytics
          </h2>
          <p className="text-xs text-copy-muted">
            Executive metrics, member acquisition trends, and event attendance conversion
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-subtle rounded-xl border border-surface-border self-start sm:self-auto">
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
      </div>

      {/* 1. Stat Cards */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-copy-muted">
          Summary Overview ({data.range.label})
        </h3>
        <ClubAnalyticsStatCards
          stats={data.statCards}
          rangeLabel={data.range.label}
        />
      </section>

      {/* 2. Visual Charts (Members & Event Attendance) */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-copy-primary">
          Trends & Comparative Performance
        </h3>
        <ClubAnalyticsCharts
          membersOverTime={data.membersOverTime}
          eventAttendance={data.eventAttendance}
          rangeLabel={data.range.label}
        />
      </section>

      {/* 3. Detailed Event Performance Breakdown Table */}
      <section className="space-y-4">
        <ClubAnalyticsEventsTable
          events={data.eventAttendance}
          clubId={clubId}
        />
      </section>

      {/* 4. Participation Distribution */}
      <section className="space-y-4">
        <ClubAnalyticsParticipation
          distribution={data.participation}
          rangeLabel={data.range.label}
        />
      </section>

      {/* 5. Executive Election History */}
      <section className="space-y-4">
        <ClubAnalyticsElectionHistory />
      </section>
    </div>
  );
}
