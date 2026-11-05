import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlatformRole, EventStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/get-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { AdminNavTabs } from "@/components/admin/admin-nav-tabs";
import {
  AdminClubsTable,
  AdminClubRow,
  AvailableAdvisor,
} from "@/components/admin/admin-clubs-table";

export const metadata: Metadata = {
  title: "Club Controls & Oversight | ClubSphere Administration",
  description: "Administrative governance, organization status management, and faculty sponsor assignments.",
};

export default async function AdminClubsPage() {
  const user = await requireUser();

  if (user.role !== PlatformRole.ADMIN) {
    notFound();
  }

  // Fetch all clubs and all available advisors concurrently
  const [clubsRaw, advisorsRaw] = await Promise.all([
    prisma.club.findMany({
      include: {
        advisor: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            memberships: { where: { status: "ACTIVE" } },
            events: { where: { status: EventStatus.COMPLETED } },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: PlatformRole.ADVISOR },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const clubs: AdminClubRow[] = clubsRaw.map((c) => ({
    id: c.id,
    name: c.name,
    status: c.status,
    createdAt: c.createdAt,
    advisor: {
      id: c.advisor.id,
      name: c.advisor.name,
      email: c.advisor.email,
    },
    activeMembersCount: c._count.memberships,
    eventsHeldCount: c._count.events,
  }));

  const advisors: AvailableAdvisor[] = advisorsRaw.map((a) => ({
    id: a.id,
    name: a.name,
    email: a.email,
    department: a.department,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Governance"
        description="Oversee official campus organization charters, manage suspensions and reinstatements, and reassign faculty sponsors."
        actions={<AdminNavTabs />}
      />

      <AdminClubsTable initialClubs={clubs} advisors={advisors} />
    </div>
  );
}
