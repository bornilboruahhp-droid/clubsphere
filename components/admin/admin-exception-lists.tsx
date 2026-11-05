import Link from "next/link";
import {
  AlertTriangle,
  CalendarX,
  CheckCircle2,
  ArrowRight,
  Clock,
  Building2,
  Users,
} from "lucide-react";

import { AdminExceptionsData } from "@/lib/analytics/admin";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AdminExceptionListsProps {
  exceptions: AdminExceptionsData;
}

export function AdminExceptionLists({ exceptions }: AdminExceptionListsProps) {
  const { overdueApprovals, inactiveClubs } = exceptions;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Overdue Reviews (>7 Days) */}
      <div className="rounded-2xl border border-surface-border bg-surface p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-surface-border">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-copy-primary">
                  Overdue Reviews
                </h3>
                {overdueApprovals.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-state-error-dim text-state-error text-xs font-semibold px-2 py-0.5 border-none"
                  >
                    {overdueApprovals.length} flagged
                  </Badge>
                )}
              </div>
              <p className="text-xs text-copy-muted">
                Registrations awaiting advisor or admin decision for &gt; 7 days
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs gap-1">
              <Link href="/reviews">
                Review Queue
                <ArrowRight className="size-3" />
              </Link>
            </Button>
          </div>

          <div className="pt-4 divide-y divide-surface-border/60">
            {overdueApprovals.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="size-8 text-state-success mx-auto" />
                <h4 className="text-xs font-semibold text-copy-primary">
                  Review Queue Clean
                </h4>
                <p className="text-xs text-copy-muted max-w-xs mx-auto">
                  All pending club submissions have been active for fewer than 7 days.
                </p>
              </div>
            ) : (
              overdueApprovals.map((item) => (
                <div
                  key={item.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 first:pt-0 last:pb-0"
                >
                  <div className="space-y-0.5 min-w-0">
                    <Link
                      href={`/clubs/${item.clubId}`}
                      className="text-xs font-semibold text-copy-primary hover:text-brand hover:underline truncate block"
                    >
                      {item.clubName}
                    </Link>
                    <div className="flex items-center gap-2 text-[11px] text-copy-muted">
                      <span className="font-medium text-copy-secondary">
                        {item.stage} Stage
                      </span>
                      <span>•</span>
                      <span>Submitted {formatDate(item.submittedAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="inline-flex items-center gap-1 text-xs font-semibold text-state-error bg-state-error-dim px-2 py-1 rounded-lg">
                      <Clock className="size-3" />
                      {item.daysPending} days pending
                    </div>
                    <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
                      <Link href={`/clubs/${item.clubId}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 2. Inactive Clubs (No events in last 90 days) */}
      <div className="rounded-2xl border border-surface-border bg-surface p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-surface-border">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-copy-primary">
                  Inactive Organizations
                </h3>
                {inactiveClubs.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-state-warning-dim text-state-warning text-xs font-semibold px-2 py-0.5 border-none"
                  >
                    {inactiveClubs.length} inactive
                  </Badge>
                )}
              </div>
              <p className="text-xs text-copy-muted">
                Active clubs with no completed or published event in the past 90 days
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs gap-1">
              <Link href="/clubs">
                Club Directory
                <ArrowRight className="size-3" />
              </Link>
            </Button>
          </div>

          <div className="pt-4 divide-y divide-surface-border/60">
            {inactiveClubs.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="size-8 text-state-success mx-auto" />
                <h4 className="text-xs font-semibold text-copy-primary">
                  Active Engagement
                </h4>
                <p className="text-xs text-copy-muted max-w-xs mx-auto">
                  Every active club on campus has hosted or scheduled an event in the last 90 days.
                </p>
              </div>
            ) : (
              inactiveClubs.map((club) => (
                <div
                  key={club.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 first:pt-0 last:pb-0"
                >
                  <div className="space-y-0.5 min-w-0">
                    <Link
                      href={`/clubs/${club.id}`}
                      className="text-xs font-semibold text-copy-primary hover:text-brand hover:underline truncate block"
                    >
                      {club.name}
                    </Link>
                    <div className="flex items-center gap-2 text-[11px] text-copy-muted">
                      <span className="flex items-center gap-1 text-copy-secondary">
                        <Users className="size-3 text-copy-muted" />
                        {club.activeMemberCount} active members
                      </span>
                      <span>•</span>
                      <span>Chartered {formatDate(club.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="inline-flex items-center gap-1 text-xs text-copy-muted bg-subtle px-2 py-1 rounded-lg">
                      <CalendarX className="size-3 text-copy-muted" />
                      {club.lastEventDate
                        ? `Last event ${formatDate(club.lastEventDate)}`
                        : "No events held"}
                    </div>
                    <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
                      <Link href={`/clubs/${club.id}`}>Inspect</Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
