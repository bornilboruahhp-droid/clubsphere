import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/get-current-user";
import { requireClubManager } from "@/lib/access";
import { notFound, invalidState, validationError } from "@/lib/api/errors";
import { ok, paginated, handleError } from "@/lib/api/response";
import { logAudit } from "@/lib/audit/log";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { notifyUsers } from "@/lib/notifications/notify";
import {
  announcementCreateSchema,
  announcementsQuerySchema,
} from "@/lib/validation/announcement";

interface RouteParams {
  params: Promise<{
    clubId: string;
  }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireUser();
    const { clubId } = await params;

    // Access control: Club managers (PRESIDENT, SECRETARY) or platform ADMIN
    await requireClubManager(user, clubId);

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, name: true, status: true },
    });

    if (!club) {
      throw notFound("Club not found");
    }

    if (club.status !== "ACTIVE" && user.role !== "ADMIN") {
      throw invalidState("Announcements can only be created for active clubs");
    }

    const body = await request.json();
    const input = announcementCreateSchema.parse(body);

    // If audience is EVENT_REGISTRANTS, ensure eventId belongs to this club
    if (input.audience === "EVENT_REGISTRANTS") {
      const event = await prisma.event.findFirst({
        where: { id: input.eventId!, clubId },
        select: { id: true, title: true },
      });

      if (!event) {
        throw validationError("The targeted event does not exist in this organization");
      }
    }

    const announcement = await prisma.$transaction(async (tx) => {
      const created = await tx.announcement.create({
        data: {
          clubId,
          authorId: user.id,
          title: input.title,
          body: input.body,
          audience: input.audience,
          eventId: input.audience === "EVENT_REGISTRANTS" ? input.eventId : null,
        },
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
          event: {
            select: { id: true, title: true },
          },
        },
      });

      await logAudit(tx, {
        actorId: user.id,
        action: AUDIT_ACTIONS.ANNOUNCEMENT.CREATED,
        entityType: "ANNOUNCEMENT",
        entityId: created.id,
        clubId,
        metadata: {
          title: created.title,
          audience: created.audience,
          eventId: created.eventId,
        },
      });

      return created;
    });

    // Post-commit: Resolve recipient audience & dispatch notifications
    let recipientIds: string[] = [];

    if (input.audience === "ALL_MEMBERS") {
      const members = await prisma.membership.findMany({
        where: {
          clubId,
          status: "ACTIVE",
          userId: { not: user.id },
        },
        select: { userId: true },
      });
      recipientIds = members.map((m) => m.userId);
    } else if (input.audience === "EVENT_REGISTRANTS" && input.eventId) {
      const registrations = await prisma.eventRegistration.findMany({
        where: {
          eventId: input.eventId,
          status: { not: "CANCELLED" },
          userId: { not: user.id },
        },
        select: { userId: true },
      });
      recipientIds = Array.from(new Set(registrations.map((r) => r.userId)));
    }

    if (recipientIds.length > 0) {
      await notifyUsers(recipientIds, {
        type: "ANNOUNCEMENT",
        title: `${club.name}: ${announcement.title}`,
        body: announcement.body.slice(0, 150),
        href: `/clubs/${clubId}?tab=announcements`,
      });
    }

    return ok(announcement, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
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
      select: { id: true, advisorId: true },
    });

    if (!club) {
      throw notFound("Club not found");
    }

    // Access control: ACTIVE members, the club advisor, admins
    let canView = user.role === "ADMIN" || club.advisorId === user.id;

    if (!canView) {
      const membership = await prisma.membership.findFirst({
        where: {
          clubId,
          userId: user.id,
          status: "ACTIVE",
        },
        select: { id: true },
      });
      canView = Boolean(membership);
    }

    if (!canView) {
      throw notFound("Club not found");
    }

    const { searchParams } = new URL(request.url);
    const query = announcementsQuerySchema.parse({
      cursor: searchParams.get("cursor") || undefined,
      limit: searchParams.get("limit") || undefined,
    });

    const announcements = await prisma.announcement.findMany({
      where: { clubId },
      take: query.limit + 1,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        event: {
          select: { id: true, title: true },
        },
      },
    });

    const hasMore = announcements.length > query.limit;
    const items = hasMore ? announcements.slice(0, query.limit) : announcements;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return paginated(items, nextCursor);
  } catch (error) {
    return handleError(error);
  }
}
