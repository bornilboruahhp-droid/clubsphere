import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/get-current-user";
import { forbidden, notFound, invalidState, validationError } from "@/lib/api/errors";
import { ok, handleError } from "@/lib/api/response";
import { logAudit } from "@/lib/audit/log";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { canTransitionAttendance } from "@/lib/events/attendance-transitions";
import { attendanceBulkSchema } from "@/lib/validation/attendance";

interface RouteParams {
  params: Promise<{
    eventId: string;
  }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireUser();
    const { eventId } = await params;

    const body = await request.json();
    const { registrationIds, status: targetStatus } = attendanceBulkSchema.parse(body);

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
      // Find candidate registrations for this event
      const candidates = await tx.eventRegistration.findMany({
        where: {
          id: { in: registrationIds },
          eventId,
          status: { not: "CANCELLED" },
        },
        select: {
          id: true,
          status: true,
          checkedInAt: true,
        },
      });

      // Filter eligible according to transition rules
      const eligible = candidates.filter((c) =>
        canTransitionAttendance(c.status, targetStatus)
      );

      if (eligible.length === 0) {
        throw validationError("No eligible registrations found for the specified status transition");
      }

      if (targetStatus === "PRESENT") {
        const needsCheckIn = eligible
          .filter((c) => !c.checkedInAt)
          .map((c) => c.id);
        const alreadyCheckedIn = eligible
          .filter((c) => c.checkedInAt)
          .map((c) => c.id);

        if (needsCheckIn.length > 0) {
          await tx.eventRegistration.updateMany({
            where: { id: { in: needsCheckIn } },
            data: {
              status: "PRESENT",
              statusChangedAt: now,
              checkedInAt: now,
            },
          });
        }

        if (alreadyCheckedIn.length > 0) {
          await tx.eventRegistration.updateMany({
            where: { id: { in: alreadyCheckedIn } },
            data: {
              status: "PRESENT",
              statusChangedAt: now,
            },
          });
        }
      } else {
        // ABSENT
        await tx.eventRegistration.updateMany({
          where: { id: { in: eligible.map((c) => c.id) } },
          data: {
            status: "ABSENT",
            statusChangedAt: now,
          },
        });
      }

      // Single audit entry for bulk update
      await logAudit(tx, {
        actorId: user.id,
        action: AUDIT_ACTIONS.ATTENDANCE.MARKED,
        entityType: "EVENT",
        entityId: event.id,
        clubId: event.clubId,
        metadata: {
          eventId: event.id,
          count: eligible.length,
          status: targetStatus,
        },
      });

      return {
        updatedCount: eligible.length,
        status: targetStatus,
      };
    });

    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}
