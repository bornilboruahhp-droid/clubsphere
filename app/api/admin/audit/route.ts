import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/get-current-user";
import { requireAdmin } from "@/lib/access";
import { paginated, handleError } from "@/lib/api/response";
import { describeAuditEntry } from "@/lib/audit/describe";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    requireAdmin(user);

    const { searchParams } = new URL(request.url);
    const actorId = searchParams.get("actorId")?.trim();
    const action = searchParams.get("action")?.trim();
    const entityType = searchParams.get("entityType")?.trim();
    const entityId = searchParams.get("entityId")?.trim();
    const from = searchParams.get("from")?.trim();
    const to = searchParams.get("to")?.trim();
    const cursor = searchParams.get("cursor")?.trim();
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 50), 1), 100);

    const where: Prisma.AuditLogWhereInput = {};

    if (actorId) {
      where.actorId = actorId;
    }

    if (action) {
      // Prefix match for action (e.g. "club.", "event.", "report.")
      where.action = { startsWith: action };
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
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

    const actors = actorIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, name: true, email: true },
        })
      : [];

    const actorMap = new Map(actors.map((a) => [a.id, a]));

    const enrichedItems = items.map((log) => {
      const actor = log.actorId ? actorMap.get(log.actorId) : null;
      const actorName = actor?.name || actor?.email || (log.actorId ? "Unknown User" : "System");
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

    return paginated(enrichedItems, nextCursor);
  } catch (error) {
    return handleError(error);
  }
}
