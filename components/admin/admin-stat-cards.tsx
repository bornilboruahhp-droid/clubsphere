import {
  Building2,
  Clock,
  Users,
  CalendarCheck,
  UserCheck,
} from "lucide-react";

import { AdminStatCards as StatCardsData } from "@/lib/analytics/admin";

interface AdminStatCardsProps {
  stats: StatCardsData;
  rangeLabel: string;
}

export function AdminStatCards({ stats, rangeLabel }: AdminStatCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Active Clubs */}
      <div className="rounded-2xl border border-surface-border bg-surface p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-copy-muted">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Active Clubs
          </span>
          <div className="size-8 rounded-lg bg-state-success-dim text-state-success flex items-center justify-center">
            <Building2 className="size-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-copy-primary">
            {stats.activeClubs.toLocaleString()}
          </div>
          <p className="text-xs text-copy-muted mt-1">Official campus clubs</p>
        </div>
      </div>

      {/* 2. Pending Approvals */}
      <div className="rounded-2xl border border-surface-border bg-surface p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-copy-muted">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Pending Reviews
          </span>
          <div className="size-8 rounded-lg bg-state-warning-dim text-state-warning flex items-center justify-center">
            <Clock className="size-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-copy-primary">
            {stats.pendingApprovals.toLocaleString()}
          </div>
          <p className="text-xs text-copy-muted mt-1">Awaiting advisor / admin</p>
        </div>
      </div>

      {/* 3. Active Members */}
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
          <p className="text-xs text-copy-muted mt-1">Distinct enrolled students</p>
        </div>
      </div>

      {/* 4. Events Held */}
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

      {/* 5. Avg Attendance Rate */}
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
            {stats.attendanceRate !== null
              ? `${stats.attendanceRate.toFixed(1)}%`
              : "N/A"}
          </div>
          <p className="text-xs text-copy-muted mt-1">
            {stats.presentCount + stats.absentCount > 0
              ? `${stats.presentCount} present / ${stats.presentCount + stats.absentCount} checked`
              : "No attendance records"}
          </p>
        </div>
      </div>
    </div>
  );
}
