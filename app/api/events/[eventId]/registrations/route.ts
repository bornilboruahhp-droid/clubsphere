import { NextRequest } from "next/server";
import type { EventStatus, EventVisibility } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/get-current-user";
import { requireProfileComplete } from "@/lib/access";
import { notFound, conflict, forbidden, validationError, invalidState } from "@/lib/api/errors";
import { ok, paginated, handleError } from "@/lib/api/response";
import { logAudit } from "@/lib/audit/log";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { registrationsQuerySchema } from "@/lib/validation/event-registration";

interface RouteParams {
  params: Promise<{
    eventId: string;
  }>;
}

export async function POST(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireUser();
    requireProfileComplete(user);
    const { eventId } = await params;

    const registration = await prisma.$transaction(async (tx) => {
      // 1. Lock the event row for update to serialize concurrent registrations
      const rows = await tx.$queryRaw<
        Array<{
          id: string;
          clubId: string;
          title: string;
          status: EventStatus;
          visibility: EventVisibility;
          capacity: number | null;
          startsAt: Date;
          endsAt: Date;
        }>
      >`SELECT id, "clubId", title, status, visibility, capacity, "startsAt", "endsAt" FROM "Event" WHERE id = ${eventId} FOR UPDATE`;

      if (rows.length === 0) {
        throw notFound("Event not found");
      }

      const event = rows[0];

      // 2. Event must be PUBLISHED and not ended
      if (event.status !== "PUBLISHED") {
        throw validationError("Only published events accept registrations");
      }

      if (new Date(event.endsAt) <= new Date()) {
        throw validationError("This event has already ended");
      }

      // 2b. Hosting club must be ACTIVE (suspended clubs are read-only)
      const club = await tx.club.findUnique({
        where: { id: event.clubId },
        select: { status: true },
      });
      if (club?.status !== "ACTIVE") {
        throw invalidState("Registrations are unavailable for suspended organizations");
      }

      // 3. MEMBERS_ONLY check: require ACTIVE membership in the event's club
      if (event.visibility === "MEMBERS_ONLY" && user.role !== "ADMIN") {
        const membership = await tx.membership.findFirst({
          where: {
            clubId: event.clubId,
            userId: user.id,
            status: "ACTIVE",
          },
        });

        if (!membership) {
          throw forbidden("This event is restricted to active club members");
        }
      }

      // 4. Capacity check: count registrations whose status is not CANCELLED
      const activeCount = await tx.eventRegistration.count({
        where: {
          eventId,
          status: { not: "CANCELLED" },
        },
      });

      if (event.capacity !== null && activeCount >= event.capacity) {
        throw conflict("Event has reached maximum capacity");
      }

      // 5. Check existing registration
      const existing = await tx.eventRegistration.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId: user.id,
          },
        },
      });

      const now = new Date();
      let savedRegistration;

      if (!existing) {
        // No row: create REGISTERED
        savedRegistration = await tx.eventRegistration.create({
          data: {
            eventId,
            userId: user.id,
            status: "REGISTERED",
            statusChangedAt: now,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                studentId: true,
              },
            },
          },
        });
      } else if (existing.status === "CANCELLED") {
        // Existing CANCELLED: set back to REGISTERED and update statusChangedAt
        savedRegistration = await tx.eventRegistration.update({
          where: { id: existing.id },
          data: {
            status: "REGISTERED",
            statusChangedAt: now,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                studentId: true,
              },
            },
          },
        });
      } else {
        // Any other existing status: 409 CONFLICT
        throw conflict("Already registered for this event");
      }

      // 6. Write audit entry event.registered
      await logAudit(tx, {
        actorId: user.id,
        action: AUDIT_ACTIONS.EVENT.REGISTERED,
        entityType: "EVENT_REGISTRATION",
        entityId: savedRegistration.id,
        clubId: event.clubId,
        metadata: {
          eventId: event.id,
          eventTitle: event.title,
        },
      });

      return savedRegistration;
    });

    return ok(registration, { status: 201 });
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
    const { eventId } = await params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        clubId: true,
      },
    });

    if (!event) {
      throw notFound("Event not found");
    }

    // Access control: managers, officers, the club advisor, and admins
    let isAuthorized = user.role === "ADMIN";

    if (!isAuthorized) {
      const club = await prisma.club.findUnique({
        where: { id: event.clubId },
        select: { advisorId: true },
      });

      if (club?.advisorId === user.id) {
        isAuthorized = true;
      } else {
        const officerMembership = await prisma.membership.findFirst({
          where: {
            clubId: event.clubId,
            userId: user.id,
            status: "ACTIVE",
            role: { in: ["PRESIDENT", "SECRETARY", "TREASURER"] },
          },
        });

        if (officerMembership) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      throw notFound("Event not found");
    }

    const { searchParams } = new URL(request.url);
    const query = registrationsQuerySchema.parse({
      status: searchParams.get("status") || undefined,
      cursor: searchParams.get("cursor") || undefined,
      limit: searchParams.get("limit") || undefined,
    });

    const registrations = await prisma.eventRegistration.findMany({
      where: {
        eventId,
        ...(query.status ? { status: query.status } : {}),
      },
      take: query.limit + 1,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        statusChangedAt: true,
        checkedInAt: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            studentId: true,
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
