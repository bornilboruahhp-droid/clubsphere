import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/get-current-user";
import { forbidden, notFound, invalidState } from "@/lib/api/errors";
import { ok, handleError } from "@/lib/api/response";
import { logAudit } from "@/lib/audit/log";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";

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
    const { eventId } = await params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        clubId: true,
        status: true,
        startsAt: true,
      },
    });

    if (!event) {
      throw notFound("Event not found");
    }

    // Access control: Club managers (PRESIDENT, SECRETARY) or platform ADMIN
    if (user.role !== "ADMIN") {
      const membership = await prisma.membership.findFirst({
        where: {
          clubId: event.clubId,
          userId: user.id,
          status: "ACTIVE",
          role: { in: ["PRESIDENT", "SECRETARY"] },
        },
      });

      if (!membership) {
        throw forbidden("Only club managers or administrators can record attendance");
      }
    }

    // Event state rule: PUBLISHED & already started, or COMPLETED
    const now = new Date();
    const isAllowedState =
      (event.status === "PUBLISHED" && event.startsAt <= now) ||
      event.status === "COMPLETED";

    if (!isAllowedState) {
      if (event.status === "PUBLISHED" && event.startsAt > now) {
        throw invalidState("Attendance can only be recorded once the event has started");
      }
      throw invalidState("Attendance cannot be recorded for draft or cancelled events");
    }

    const result = await prisma.$transaction(async (tx) => {
      // Find all remaining REGISTERED registrations for this event
      const remaining = await tx.eventRegistration.findMany({
        where: {
          eventId,
          status: "REGISTERED",
        },
        select: {
          id: true,
        },
      });

      if (remaining.length > 0) {
        await tx.eventRegistration.updateMany({
          where: {
            eventId,
            status: "REGISTERED",
          },
          data: {
            status: "ABSENT",
            statusChangedAt: now,
          },
        });
      }

      // Single audit entry for finalize
      await logAudit(tx, {
        actorId: user.id,
        action: AUDIT_ACTIONS.ATTENDANCE.FINALIZED,
        entityType: "EVENT",
        entityId: event.id,
        clubId: event.clubId,
        metadata: {
          eventId: event.id,
          count: remaining.length,
          status: "ABSENT",
        },
      });

      return {
        finalizedCount: remaining.length,
      };
    });

    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}
