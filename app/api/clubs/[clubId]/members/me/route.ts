import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api/response";
import { notFound, validationError } from "@/lib/api/errors";
import { logAudit } from "@/lib/audit/log";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";

interface RouteParams {
  params: Promise<{
    clubId: string;
  }>;
}

/**
 * DELETE /api/clubs/[clubId]/members/me
 * Leave a club as an active non-president member, or cancel a pending join request.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { clubId } = await params;

    const membership = await prisma.membership.findFirst({
      where: {
        clubId,
        userId: user.id,
        status: { in: ["ACTIVE", "PENDING"] },
      },
    });

    if (!membership) {
      throw notFound("Membership not found");
    }

    if (membership.status === "ACTIVE" && membership.role === "PRESIDENT") {
      throw validationError(
        "The club president cannot leave the club before transferring the presidency"
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.membership.update({
        where: { id: membership.id },
        data: {
          status: "REMOVED",
          removedAt: new Date(),
        },
      });

      await logAudit(tx, {
        action: membership.status === "PENDING"
          ? AUDIT_ACTIONS.MEMBERSHIP.REMOVED
          : AUDIT_ACTIONS.MEMBERSHIP.LEFT,
        entityType: "membership",
        entityId: membership.id,
        actorId: user.id,
        clubId,
        metadata: {
          role: membership.role,
          previousStatus: membership.status,
          cancelledRequest: membership.status === "PENDING",
        },
      });
    });

    return ok({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
