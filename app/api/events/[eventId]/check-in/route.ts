import { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/get-current-user";
import { notFound, invalidState, conflict, validationError } from "@/lib/api/errors";
import { ok, handleError } from "@/lib/api/response";
import { logAudit } from "@/lib/audit/log";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { verifyCheckinToken } from "@/lib/events/checkin-token";

interface RouteParams {
  params: Promise<{
    eventId: string;
  }>;
}

const checkInSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireUser();
    const { eventId } = await params;

    const body = await request.json();
    const { token } = checkInSchema.parse(body);

    // 1. Verify token with timing-safe HMAC evaluation across valid buckets
    const isValidToken = verifyCheckinToken(eventId, token);
    if (!isValidToken) {
      throw validationError(
        "Invalid or expired check-in code. Please scan the current code displayed on the screen."
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        clubId: true,
        title: true,
        status: true,
        startsAt: true,
        endsAt: true,
      },
    });

    if (!event) {
      throw notFound("Event not found");
    }

    if (event.status !== "PUBLISHED") {
      throw invalidState("Check-in is only available for published events");
    }

    // 2. Window check: 30 minutes before startsAt until 60 minutes after endsAt
    const now = new Date();
    const windowStart = new Date(event.startsAt.getTime() - 30 * 60 * 1000);
    const windowEnd = new Date(event.endsAt.getTime() + 60 * 60 * 1000);

    if (now < windowStart) {
      throw invalidState(
        "Check-in has not opened yet. Check-in opens 30 minutes before the event begins."
      );
    }

    if (now > windowEnd) {
      throw invalidState("Check-in has closed for this event.");
    }

    const result = await prisma.$transaction(async (tx) => {
      // 3. User must have an existing registration
      const registration = await tx.eventRegistration.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId: user.id,
          },
        },
      });

      if (!registration || registration.status === "CANCELLED") {
        throw conflict(
          "You must register for this event before checking in. Please register on the event page first."
        );
      }

      // 4. Idempotent check: if already PRESENT, return success
      if (registration.status === "PRESENT") {
        return {
          success: true,
          alreadyCheckedIn: true,
          eventTitle: event.title,
          checkedInAt: registration.checkedInAt || registration.statusChangedAt,
        };
      }

      // 5. Transition to PRESENT
      const checkedInAt = registration.checkedInAt ?? now;
      const updated = await tx.eventRegistration.update({
        where: { id: registration.id },
        data: {
          status: "PRESENT",
          checkedInAt,
          statusChangedAt: now,
        },
      });

      // 6. Audit log entry attendance.checked_in
      await logAudit(tx, {
        actorId: user.id,
        action: AUDIT_ACTIONS.ATTENDANCE.CHECKED_IN,
        entityType: "EVENT_REGISTRATION",
        entityId: registration.id,
        clubId: event.clubId,
        metadata: {
          eventId: event.id,
          eventTitle: event.title,
          checkedInAt: checkedInAt.toISOString(),
        },
      });

      return {
        success: true,
        alreadyCheckedIn: false,
        eventTitle: event.title,
        checkedInAt,
      };
    });

    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}
