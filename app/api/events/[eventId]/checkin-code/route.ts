import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/get-current-user";
import { forbidden, notFound, invalidState } from "@/lib/api/errors";
import { ok, handleError } from "@/lib/api/response";
import {
  generateCheckinToken,
  getSecondsUntilNextBucket,
} from "@/lib/events/checkin-token";

interface RouteParams {
  params: Promise<{
    eventId: string;
  }>;
}

export async function GET(
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
        title: true,
        status: true,
        startsAt: true,
        endsAt: true,
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
        throw forbidden("Only club managers or administrators can access the check-in code");
      }
    }

    // Allowed for PUBLISHED or COMPLETED events
    if (event.status !== "PUBLISHED" && event.status !== "COMPLETED") {
      throw invalidState("Check-in codes are only available for published events");
    }

    const token = generateCheckinToken(event.id);
    const expiresInSeconds = getSecondsUntilNextBucket();
    const checkinUrl = `/events/${event.id}/check-in?t=${token}`;

    return ok({
      token,
      checkinUrl,
      expiresInSeconds,
      event: {
        id: event.id,
        title: event.title,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
