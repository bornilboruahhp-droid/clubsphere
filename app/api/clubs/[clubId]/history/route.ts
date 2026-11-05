import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/get-current-user";
import { notFound, forbidden } from "@/lib/api/errors";
import { paginated, handleError } from "@/lib/api/response";
import { describeAuditEntry } from "@/lib/audit/describe";

interface RouteParams {
  params: Promise<{
    clubId: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireUser();
    const { clubId } = await params;

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, name: true, advisorId: true },
    });

    if (!club) {
      throw notFound("Club not found");
    }

    const isAdmin = user.role === "ADMIN";
    const isAdvisor = club.advisorId === user.id;

    if (!isAdmin && !isAdvisor) {
      const officerMembership = await prisma.membership.findFirst({
        where: {
          clubId,
          userId: user.id,
          status: "ACTIVE",
          role: { in: ["PRESIDENT", "SECRETARY", "TREASURER"] },
        },
        select: { id: true },
      });

      if (!officerMembership) {
        throw forbidden("You do not have permission to view organization history");
      }
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor")?.trim();
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 25), 1), 100);

    // Invariant: Never return entries for election.vote_cast to non-admins
    const where: Prisma.AuditLogWhereInput = {
      clubId,
      ...(!isAdmin ? { action: { not: "election.vote_cast" } } : {}),
    };

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
        createdAt: log.createdAt,
        metadata: log.metadata,
        description,
      };
    });

    return paginated(enrichedItems, nextCursor);
  } catch (error) {
    return handleError(error);
  }
}
