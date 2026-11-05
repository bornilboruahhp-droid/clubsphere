import { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/get-current-user";
import { requireAdmin } from "@/lib/access";
import { notFound, invalidState, validationError } from "@/lib/api/errors";
import { ok, handleError } from "@/lib/api/response";
import { logAudit } from "@/lib/audit/log";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { notifyUsers } from "@/lib/notifications/notify";
import { canTransition } from "@/lib/clubs/transitions";

interface RouteParams {
  params: Promise<{
    clubId: string;
  }>;
}

const suspendSchema = z.object({
  reason: z
    .string({ required_error: "Suspension reason is required" })
    .trim()
    .min(5, "Suspension reason must be at least 5 characters"),
});

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireUser();
    requireAdmin(user);

    const { clubId } = await params;
    const body = await request.json().catch(() => ({}));
    const parseResult = suspendSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || "Invalid reason";
      throw validationError(firstError);
    }

    const { reason } = parseResult.data;

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: {
        id: true,
        name: true,
        status: true,
        advisorId: true,
      },
    });

    if (!club) {
      throw notFound("Club not found");
    }

    if (!canTransition(club.status, "SUSPENDED")) {
      throw invalidState(
        `Cannot suspend organization with status "${club.status}". Only ACTIVE clubs can be suspended.`
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedClub = await tx.club.update({
        where: { id: clubId },
        data: { status: "SUSPENDED" },
        select: {
          id: true,
          name: true,
          status: true,
          advisorId: true,
          updatedAt: true,
        },
      });

      await logAudit(tx, {
        actorId: user.id,
        action: AUDIT_ACTIONS.CLUB.SUSPENDED,
        entityType: "CLUB",
        entityId: clubId,
        clubId,
        metadata: {
          reason,
          previousStatus: club.status,
        },
      });

      return updatedClub;
    });

    // Notify active members and advisor after transaction commits
    const activeMembers = await prisma.membership.findMany({
      where: { clubId, status: "ACTIVE" },
      select: { userId: true },
    });

    const recipientIds = Array.from(
      new Set([...activeMembers.map((m) => m.userId), club.advisorId])
    );

    if (recipientIds.length > 0) {
      await notifyUsers(recipientIds, {
        type: "CLUB_DECISION",
        title: `Organization Suspended: ${club.name}`,
        body: `This organization was suspended by campus administration. Reason: ${reason}`,
        href: `/clubs/${club.id}`,
      });
    }

    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}
