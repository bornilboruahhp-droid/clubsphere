import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlatformRole } from "@prisma/client";
import { Download } from "lucide-react";

import { requireUser } from "@/lib/auth/get-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  parseRange,
  getAdminStatCards,
  getClubsByStatus,
  getNewMembershipsPerMonth,
  getEventsHeldPerMonth,
  getAdminExceptions,
} from "@/lib/analytics/admin";
import { AdminRangeSelector } from "@/components/admin/admin-range-selector";
import { AdminNavTabs } from "@/components/admin/admin-nav-tabs";
import { AdminStatCards } from "@/components/admin/admin-stat-cards";
import { AdminCharts } from "@/components/admin/admin-charts";
import { AdminExceptionLists } from "@/components/admin/admin-exception-lists";

export const metadata: Metadata = {
  title: "Admin Dashboard | ClubSphere",
  description: "Institutional governance metrics, activity analytics, and exception lists for campus administrators.",
};

interface AdminPageProps {
  searchParams: Promise<{
    range?: string;
  }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const user = await requireUser();

  // Access control: Platform ADMINISTRATORS only
  if (user.role !== PlatformRole.ADMIN) {
    notFound();
  }

  const { range: rangeParam } = await searchParams;
  const { range, label: rangeLabel } = parseRange(rangeParam);

  // Fetch all analytics datasets concurrently
  const [stats, clubsByStatus, membershipsPerMonth, eventsPerMonth, exceptions] =
    await Promise.all([
      getAdminStatCards(range),
      getClubsByStatus(),
      getNewMembershipsPerMonth(range),
      getEventsHeldPerMonth(range),
      getAdminExceptions(),
    ]);

  return (
    <div className="space-y-8">
      {/* Navigation Tabs, Actions & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <AdminNavTabs />
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 px-3 text-xs gap-1.5 rounded-xl border-surface-border text-copy-primary hover:bg-subtle"
          >
            <a href="/api/admin/reports/clubs" download>
              <Download className="size-3.5 text-copy-muted" />
              <span>Export Clubs (CSV)</span>
            </a>
          </Button>
          <AdminRangeSelector currentRange={range} />
        </div>
      </div>

      <PageHeader
        title="Administration & Governance"
        description="Campus-wide organization metrics, member enrollment trends, event engagement, and operational exception queues."
      />

      {/* 1. Key Stat Cards */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-copy-muted">
          Platform Summary
        </h2>
        <AdminStatCards stats={stats} rangeLabel={rangeLabel} />
      </section>

      {/* 2. Visual Charts & Trends */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-copy-primary">
            Activity Trends & Distribution
          </h2>
          <span className="text-xs text-copy-muted font-medium">
            Timeframe: {rangeLabel}
          </span>
        </div>
        <AdminCharts
          clubsByStatus={clubsByStatus}
          membershipsPerMonth={membershipsPerMonth}
          eventsPerMonth={eventsPerMonth}
          rangeLabel={rangeLabel}
        />
      </section>

      {/* 3. Operational Exception Queues */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-copy-primary">
            Attention Required
          </h2>
          <p className="text-xs text-copy-muted">
            Stalled approval stages and organizations requiring engagement intervention
          </p>
        </div>
        <AdminExceptionLists exceptions={exceptions} />
      </section>
    </div>
  );
}
