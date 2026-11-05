import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/get-current-user";
import { requireClubManager } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api/response";
import { notFound, invalidState } from "@/lib/api/errors";
import { logAudit } from "@/lib/audit/log";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { canTransitionEvent } from "@/lib/events/transitions";
import { eventStatusChangeSchema } from "@/lib/validation/event";
import { notifyUsers } from "@/lib/notifications/notify";
import { formatDate } from "@/lib/format";

interface RouteParams {
  params: Promise<{
    eventId: string;
  }>;
}

/**
 * POST /api/events/[eventId]/status
 * Change event status (PUBLISHED, CANCELLED, COMPLETED) according to state machine.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { eventId } = await params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        club: {
          select: { id: true, name: true, status: true },
        },
      },
    });

    if (!event) {
      throw notFound("Event not found");
    }

    await requireClubManager(user, event.clubId);

    if (event.club.status !== "ACTIVE") {
      throw invalidState("Event status can only be modified for active clubs");
    }

    const body = eventStatusChangeSchema.parse(await req.json());

    // State machine transition validation
    if (!canTransitionEvent(event.status, body.status)) {
      throw invalidState(
        `Cannot transition event from ${event.status} to ${body.status}`
      );
    }

    const now = new Date();

    // Specific transition guards
    if (body.status === "PUBLISHED") {
      if (new Date(event.startsAt) <= now) {
        throw invalidState(
          "Event cannot be published because its start time has already passed"
        );
      }
    }

    if (body.status === "COMPLETED") {
      if (now < new Date(event.startsAt)) {
        throw invalidState(
          "Event cannot be marked completed before its scheduled start time"
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.event.update({
        where: { id: event.id },
        data: {
          status: body.status,
        },
      });

      const auditAction =
        body.status === "PUBLISHED"
          ? AUDIT_ACTIONS.EVENT.PUBLISHED
          : body.status === "CANCELLED"
          ? AUDIT_ACTIONS.EVENT.CANCELLED
          : AUDIT_ACTIONS.EVENT.COMPLETED;

      await logAudit(tx, {
        action: auditAction,
        entityType: "event",
        entityId: event.id,
        actorId: user.id,
        clubId: event.clubId,
        metadata: {
          previousStatus: event.status,
          newStatus: body.status,
        },
      });

      return res;
    });

    // Post-commit async notifications
    if (body.status === "PUBLISHED") {
      const activeMembers = await prisma.membership.findMany({
        where: {
          clubId: event.clubId,
          status: "ACTIVE",
        },
        select: { userId: true },
      });

      const memberIds = activeMembers.map((m) => m.userId);
      if (memberIds.length > 0) {
        notifyUsers(memberIds, {
          type: "EVENT_PUBLISHED",
          title: "New Event Published",
          body: `${event.title} has been scheduled for ${formatDate(event.startsAt)}`,
          href: `/events/${event.id}`,
        }).catch((err) => {
          console.error("Failed to notify members of published event:", err);
        });
      }
    } else if (body.status === "CANCELLED") {
      const activeRegistrations = await prisma.eventRegistration.findMany({
        where: {
          eventId: event.id,
          status: { not: "CANCELLED" },
        },
        select: { userId: true },
      });

      const registrantIds = activeRegistrations.map((r) => r.userId);
      if (registrantIds.length > 0) {
        notifyUsers(registrantIds, {
          type: "EVENT_CANCELLED",
          title: "Event Cancelled",
          body: `${event.title} has been cancelled`,
          href: `/events`,
        }).catch((err) => {
          console.error("Failed to notify registrants of cancelled event:", err);
        });
      }
    }

    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}
