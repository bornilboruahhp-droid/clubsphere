import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/get-current-user";
import { paginated, handleError } from "@/lib/api/response";
import { myEventsQuerySchema } from "@/lib/validation/event-registration";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);

    const query = myEventsQuerySchema.parse({
      when: searchParams.get("when") || undefined,
      cursor: searchParams.get("cursor") || undefined,
      limit: searchParams.get("limit") || undefined,
    });

    const now = new Date();

    const whereClause: Prisma.EventRegistrationWhereInput = {
      userId: user.id,
    };

    if (query.when === "upcoming") {
      whereClause.status = { not: "CANCELLED" };
      whereClause.event = {
        endsAt: { gte: now },
      };
    } else {
      // Past: either event already ended, or the user's registration was cancelled
      whereClause.OR = [
        {
          event: {
            endsAt: { lt: now },
          },
        },
        {
          status: "CANCELLED",
        },
      ];
    }

    const registrations = await prisma.eventRegistration.findMany({
      where: whereClause,
      take: query.limit + 1,
      ...(query.cursor
        ? {
            skip: 1,
            cursor: { id: query.cursor },
          }
        : {}),
      orderBy: [
        { event: { startsAt: query.when === "upcoming" ? "asc" : "desc" } },
        { id: "asc" },
      ],
      select: {
        id: true,
        status: true,
        statusChangedAt: true,
        checkedInAt: true,
        createdAt: true,
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            location: true,
            startsAt: true,
            endsAt: true,
            capacity: true,
            visibility: true,
            status: true,
            club: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const hasMore = registrations.length > query.limit;
    const items = hasMore ? registrations.slice(0, query.limit) : registrations;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return paginated(items, nextCursor);
  } catch (error) {
    return handleError(error);
  }
}
