import {
  Users,
  UserPlus,
  CalendarCheck,
  UserCheck,
  TrendingUp,
} from "lucide-react";

import { ClubStatCards as ClubStatCardsData } from "@/lib/analytics/club";

interface ClubAnalyticsStatCardsProps {
  stats: ClubStatCardsData;
  rangeLabel: string;
}

export function ClubAnalyticsStatCards({
  stats,
  rangeLabel,
}: ClubAnalyticsStatCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Active Members */}
      <div className="rounded-2xl border border-surface-border bg-surface p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-copy-muted">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Active Members
          </span>
          <div className="size-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
            <Users className="size-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-copy-primary">
            {stats.activeMembers.toLocaleString()}
          </div>
          <p className="text-xs text-copy-muted mt-1">Total active roster size</p>
        </div>
      </div>

      {/* 2. New Members in Range */}
      <div className="rounded-2xl border border-surface-border bg-surface p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-copy-muted">
          <span className="text-xs font-semibold uppercase tracking-wider">
            New Members
          </span>
          <div className="size-8 rounded-lg bg-state-success-dim text-state-success flex items-center justify-center">
            <UserPlus className="size-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-copy-primary">
            {stats.newMembersInRange.toLocaleString()}
          </div>
          <p className="text-xs text-copy-muted mt-1">Joined in {rangeLabel.toLowerCase()}</p>
        </div>
      </div>

      {/* 3. Events Held */}
      <div className="rounded-2xl border border-surface-border bg-surface p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-copy-muted">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Events Held
          </span>
          <div className="size-8 rounded-lg bg-state-info-dim text-state-info flex items-center justify-center">
            <CalendarCheck className="size-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-copy-primary">
            {stats.eventsHeld.toLocaleString()}
          </div>
          <p className="text-xs text-copy-muted mt-1">Completed in {rangeLabel.toLowerCase()}</p>
        </div>
      </div>

      {/* 4. Average Attendance Rate */}
      <div className="rounded-2xl border border-surface-border bg-surface p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-copy-muted">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Attendance Rate
          </span>
          <div className="size-8 rounded-lg bg-state-success-dim text-state-success flex items-center justify-center">
            <UserCheck className="size-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-copy-primary">
            {stats.averageAttendanceRate !== null
              ? `${stats.averageAttendanceRate.toFixed(1)}%`
              : "N/A"}
          </div>
          <p className="text-xs text-copy-muted mt-1">
            {stats.presentCount + stats.absentCount > 0
              ? `${stats.presentCount} present / ${stats.presentCount + stats.absentCount} checked`
              : "No attendance finalized"}
          </p>
        </div>
      </div>

      {/* 5. Registration Conversion Rate */}
      <div className="rounded-2xl border border-surface-border bg-surface p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-copy-muted">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Conversion Rate
          </span>
          <div className="size-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
            <TrendingUp className="size-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-copy-primary">
            {stats.conversionRate !== null
              ? `${stats.conversionRate.toFixed(1)}%`
              : "N/A"}
          </div>
          <p className="text-xs text-copy-muted mt-1">
            {stats.totalRegistrations > 0
              ? `${stats.presentCount} of ${stats.totalRegistrations} registered`
              : "No registrations yet"}
          </p>
        </div>
      </div>
    </div>
  );
}
