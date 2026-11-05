import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/get-current-user";
import { notFound, validationError } from "@/lib/api/errors";
import { ok, handleError } from "@/lib/api/response";
import { logAudit } from "@/lib/audit/log";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";

interface RouteParams {
  params: Promise<{
    eventId: string;
  }>;
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireUser();
    const { eventId } = await params;

    const cancelledRegistration = await prisma.$transaction(async (tx) => {
      const registration = await tx.eventRegistration.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId: user.id,
          },
        },
        include: {
          event: {
            select: {
              id: true,
              clubId: true,
              title: true,
              startsAt: true,
            },
          },
        },
      });

      if (!registration) {
        throw notFound("Registration not found");
      }

      if (registration.status !== "REGISTERED") {
        if (registration.status === "CANCELLED") {
          throw validationError("Registration is already cancelled");
        }
        throw validationError("Cannot cancel registration with current attendance status");
      }

      if (new Date(registration.event.startsAt) <= new Date()) {
        throw validationError(
          "Cannot cancel registration for an event that has already started"
        );
      }

      const now = new Date();
      const updated = await tx.eventRegistration.update({
        where: { id: registration.id },
        data: {
          status: "CANCELLED",
          statusChangedAt: now,
        },
      });

      await logAudit(tx, {
        actorId: user.id,
        action: AUDIT_ACTIONS.EVENT.REGISTRATION_CANCELLED,
        entityType: "EVENT_REGISTRATION",
        entityId: registration.id,
        clubId: registration.event.clubId,
        metadata: {
          eventId: registration.event.id,
          eventTitle: registration.event.title,
        },
      });

      return updated;
    });

    return ok(cancelledRegistration);
  } catch (error) {
    return handleError(error);
  }
}
