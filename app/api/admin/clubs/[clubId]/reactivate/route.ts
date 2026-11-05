import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/get-current-user";
import { requireAdmin } from "@/lib/access";
import { notFound, invalidState } from "@/lib/api/errors";
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

export async function POST(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireUser();
    requireAdmin(user);

    const { clubId } = await params;

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

    if (!canTransition(club.status, "ACTIVE")) {
      throw invalidState(
        `Cannot reactivate organization with status "${club.status}". Only SUSPENDED clubs can be reactivated.`
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedClub = await tx.club.update({
        where: { id: clubId },
        data: { status: "ACTIVE" },
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
        action: AUDIT_ACTIONS.CLUB.REACTIVATED,
        entityType: "CLUB",
        entityId: clubId,
        clubId,
        metadata: {
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
        title: `Organization Reactivated: ${club.name}`,
        body: `The campus administration has reinstated ${club.name} to active status.`,
        href: `/clubs/${club.id}`,
      });
    }

    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}
