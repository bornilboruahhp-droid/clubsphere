import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import { paginated, handleError } from "@/lib/api/response";
import { eventFeedQuerySchema } from "@/lib/validation/event";

/**
 * GET /api/events
 * Campus events feed (upcoming by default, cursor-paginated, visibility filtered).
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);

    const query = eventFeedQuerySchema.parse({
      from: url.searchParams.get("from") || undefined,
      to: url.searchParams.get("to") || undefined,
      clubId: url.searchParams.get("clubId") || undefined,
      q: url.searchParams.get("q") || undefined,
      cursor: url.searchParams.get("cursor") || undefined,
      limit: url.searchParams.get("limit") || 20,
    });

    const isAdmin = user.role === "ADMIN";

    // Find clubs where user is an active member to unlock MEMBERS_ONLY events
    let memberClubIds: string[] = [];
    if (!isAdmin) {
      const memberships = await prisma.membership.findMany({
        where: {
          userId: user.id,
          status: "ACTIVE",
        },
        select: { clubId: true },
      });
      memberClubIds = memberships.map((m) => m.clubId);
    }

    const now = new Date();
    const startDateFilter = query.from
      ? new Date(query.from)
      : now;

    const whereClause: any = {
      status: "PUBLISHED",
      club: {
        status: "ACTIVE",
      },
      startsAt: {
        gte: startDateFilter,
        ...(query.to ? { lte: new Date(query.to) } : {}),
      },
    };

    if (query.clubId) {
      whereClause.clubId = query.clubId;
    }

    // Visibility filter: Admins see all; users see CAMPUS or MEMBERS_ONLY for their clubs
    if (!isAdmin) {
      whereClause.OR = [
        { visibility: "CAMPUS" },
        {
          visibility: "MEMBERS_ONLY",
          clubId: { in: memberClubIds },
        },
      ];
    }

    // Keyword search filter (title, description, location)
    if (query.q && query.q.trim()) {
      const search = query.q.trim();
      whereClause.AND = [
        {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { location: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      take: query.limit + 1,
      ...(query.cursor
        ? {
            skip: 1,
            cursor: { id: query.cursor },
          }
        : {}),
      orderBy: [
        { startsAt: "asc" },
        { id: "asc" },
      ],
      include: {
        club: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        _count: {
          select: {
            registrations: {
              where: {
                status: { not: "CANCELLED" },
              },
            },
          },
        },
      },
    });

    let nextCursor: string | null = null;
    if (events.length > query.limit) {
      const nextItem = events.pop();
      nextCursor = nextItem ? nextItem.id : null;
    }

    return paginated(events, nextCursor);
  } catch (err) {
    return handleError(err);
  }
}
