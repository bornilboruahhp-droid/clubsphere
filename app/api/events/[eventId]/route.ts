import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/get-current-user";
import { requireClubManager } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api/response";
import { notFound, conflict, invalidState } from "@/lib/api/errors";
import { logAudit } from "@/lib/audit/log";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { eventUpdateSchema } from "@/lib/validation/event";

interface RouteParams {
  params: Promise<{
    eventId: string;
  }>;
}

/**
 * GET /api/events/[eventId]
 * Event details with visibility gating and active registration count.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { eventId } = await params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            status: true,
            advisorId: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
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

    if (!event) {
      throw notFound("Event not found");
    }

    const isAdmin = user.role === "ADMIN";
    const isAdvisor = event.club.advisorId === user.id;

    const callerMembership = await prisma.membership.findFirst({
      where: {
        clubId: event.clubId,
        userId: user.id,
        status: "ACTIVE",
      },
      select: { role: true },
    });

    const isMember = !!callerMembership;
    const isManager =
      isAdmin ||
      callerMembership?.role === "PRESIDENT" ||
      callerMembership?.role === "SECRETARY";

    // Non-active club visibility gate
    if (event.club.status !== "ACTIVE" && !isAdmin && !isAdvisor && !isMember) {
      throw notFound("Event not found");
    }

    // DRAFT events visible to managers and admins only
    if (event.status === "DRAFT" && !isManager) {
      throw notFound("Event not found");
    }

    // MEMBERS_ONLY events visible to club members, advisor, and admins only
    if (event.visibility === "MEMBERS_ONLY" && !isMember && !isAdvisor && !isAdmin) {
      throw notFound("Event not found");
    }

    return ok(event);
  } catch (err) {
    return handleError(err);
  }
}

/**
 * PATCH /api/events/[eventId]
 * Edit event details while DRAFT or PUBLISHED.
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { eventId } = await params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        club: {
          select: { id: true, status: true },
        },
      },
    });

    if (!event) {
      throw notFound("Event not found");
    }

    await requireClubManager(user, event.clubId);

    if (event.club.status !== "ACTIVE") {
      throw invalidState("Events can only be edited for active clubs");
    }

    if (event.status !== "DRAFT" && event.status !== "PUBLISHED") {
      throw invalidState("Events can only be edited while in DRAFT or PUBLISHED status");
    }

    const body = eventUpdateSchema.parse(await req.json());

    // Capacity check: cannot drop below existing active registrations
    if (body.capacity !== undefined && body.capacity !== null) {
      const activeRegCount = await prisma.eventRegistration.count({
        where: {
          eventId: event.id,
          status: { not: "CANCELLED" },
        },
      });

      if (body.capacity < activeRegCount) {
        throw conflict(
          `Capacity cannot be reduced below the current number of registrations (${activeRegCount})`
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const data: Record<string, any> = {};
      const changedFields: string[] = [];

      if (body.title !== undefined && body.title !== event.title) {
        data.title = body.title;
        changedFields.push("title");
      }
      if (body.description !== undefined && body.description !== event.description) {
        data.description = body.description;
        changedFields.push("description");
      }
      if (body.location !== undefined && body.location !== event.location) {
        data.location = body.location;
        changedFields.push("location");
      }
      if (body.startsAt !== undefined) {
        data.startsAt = new Date(body.startsAt);
        changedFields.push("startsAt");
      }
      if (body.endsAt !== undefined) {
        data.endsAt = new Date(body.endsAt);
        changedFields.push("endsAt");
      }
      if (body.capacity !== undefined && body.capacity !== event.capacity) {
        data.capacity = body.capacity;
        changedFields.push("capacity");
      }
      if (body.visibility !== undefined && body.visibility !== event.visibility) {
        data.visibility = body.visibility;
        changedFields.push("visibility");
      }

      const res = await tx.event.update({
        where: { id: event.id },
        data,
      });

      await logAudit(tx, {
        action: AUDIT_ACTIONS.EVENT.UPDATED,
        entityType: "event",
        entityId: event.id,
        actorId: user.id,
        clubId: event.clubId,
        metadata: {
          changedFields,
        },
      });

      return res;
    });

    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}
