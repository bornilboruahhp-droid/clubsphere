import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlatformRole, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/get-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { AdminNavTabs } from "@/components/admin/admin-nav-tabs";
import {
  AdminAuditViewer,
  AdminAuditItem,
} from "@/components/admin/admin-audit-viewer";
import { describeAuditEntry } from "@/lib/audit/describe";

export const metadata: Metadata = {
  title: "Audit History Logs | ClubSphere Administration",
  description: "Comprehensive institutional activity timeline, state mutations, and tamper-resistant security audit trails.",
};

interface AdminAuditPageProps {
  searchParams: Promise<{
    action?: string;
    entityType?: string;
    actorId?: string;
    from?: string;
    to?: string;
    cursor?: string;
  }>;
}

export default async function AdminAuditPage({
  searchParams,
}: AdminAuditPageProps) {
  const user = await requireUser();

  if (user.role !== PlatformRole.ADMIN) {
    notFound();
  }

  const { action, entityType, actorId, from, to, cursor } =
    (await searchParams) ?? {};

  const where: Prisma.AuditLogWhereInput = {};

  if (actorId) {
    where.actorId = actorId;
  }

  if (action && action !== "ALL") {
    where.action = { startsWith: action };
  }

  if (entityType) {
    where.entityType = entityType;
  }

  if (from || to) {
    where.createdAt = {};
    if (from) {
      const fromDate = new Date(from);
      if (!isNaN(fromDate.getTime())) {
        where.createdAt.gte = fromDate;
      }
    }
    if (to) {
      const toDate = new Date(to);
      if (!isNaN(toDate.getTime())) {
        where.createdAt.lte = toDate;
      }
    }
  }

  const limit = 50;
  const logs = await prisma.auditLog.findMany({
    where,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
  });

  const hasMore = logs.length > limit;
  const items = hasMore ? logs.slice(0, limit) : logs;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  // Single batch lookup for distinct actor IDs on this page (no foreign key constraint)
  const actorIds = Array.from(
    new Set(items.map((l) => l.actorId).filter(Boolean))
  ) as string[];

  const actors =
    actorIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, name: true, email: true },
        })
      : [];

  const actorMap = new Map(actors.map((a) => [a.id, a]));

  const initialLogs: AdminAuditItem[] = items.map((log) => {
    const actor = log.actorId ? actorMap.get(log.actorId) : null;
    const actorName =
      actor?.name || actor?.email || (log.actorId ? "Unknown User" : "System");
    const description = describeAuditEntry({
      action: log.action,
      actorName,
      metadata: log.metadata,
      entityType: log.entityType,
      entityId: log.entityId,
    });

    return {
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      actorId: log.actorId,
      actorName,
      actorEmail: actor?.email ?? null,
      clubId: log.clubId,
      metadata: log.metadata,
      createdAt: log.createdAt,
      description,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institutional Audit Trail"
        description="Immutable, append-only chronological log of all governance actions, member updates, and platform events."
        actions={<AdminNavTabs />}
      />

      <AdminAuditViewer
        initialLogs={initialLogs}
        nextCursor={nextCursor}
      />
    </div>
  );
}
