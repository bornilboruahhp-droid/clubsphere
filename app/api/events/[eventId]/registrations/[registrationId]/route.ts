import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/get-current-user";
import { forbidden, notFound, invalidState, validationError } from "@/lib/api/errors";
import { ok, handleError } from "@/lib/api/response";
import { logAudit } from "@/lib/audit/log";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { canTransitionAttendance } from "@/lib/events/attendance-transitions";
import { attendanceSingleSchema } from "@/lib/validation/attendance";

interface RouteParams {
  params: Promise<{
    eventId: string;
    registrationId: string;
  }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireUser();
    const { eventId, registrationId } = await params;

    const body = await request.json();
    const { status: targetStatus } = attendanceSingleSchema.parse(body);

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

    // Execute transition in transaction
    const updatedRegistration = await prisma.$transaction(async (tx) => {
      const registration = await tx.eventRegistration.findUnique({
        where: { id: registrationId },
      });

      if (!registration || registration.eventId !== eventId) {
        throw notFound("Registration not found");
      }

      if (!canTransitionAttendance(registration.status, targetStatus)) {
        throw invalidState(
          `Cannot transition attendance from ${registration.status} to ${targetStatus}`
        );
      }

      const updated = await tx.eventRegistration.update({
        where: { id: registrationId },
        data: {
          status: targetStatus,
          statusChangedAt: now,
          checkedInAt:
            targetStatus === "PRESENT"
              ? registration.checkedInAt ?? now
              : registration.checkedInAt,
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

      await logAudit(tx, {
        actorId: user.id,
        action: AUDIT_ACTIONS.ATTENDANCE.MARKED,
        entityType: "EVENT_REGISTRATION",
        entityId: registration.id,
        clubId: event.clubId,
        metadata: {
          eventId: event.id,
          targetStatus,
          previousStatus: registration.status,
          count: 1,
        },
      });

      return updated;
    });

    return ok(updatedRegistration);
  } catch (error) {
    return handleError(error);
  }
}
