import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/get-current-user";
import { requireClubManager } from "@/lib/access";
import { notFound } from "@/lib/api/errors";
import { ok, handleError } from "@/lib/api/response";
import { logAudit } from "@/lib/audit/log";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";

interface RouteParams {
  params: Promise<{
    clubId: string;
    announcementId: string;
  }>;
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireUser();
    const { clubId, announcementId } = await params;

    // Access control: Club managers (PRESIDENT, SECRETARY) or platform ADMIN
    await requireClubManager(user, clubId);

    const announcement = await prisma.announcement.findFirst({
      where: {
        id: announcementId,
        clubId,
      },
    });

    if (!announcement) {
      throw notFound("Announcement not found");
    }

    await prisma.$transaction(async (tx) => {
      await tx.announcement.delete({
        where: { id: announcementId },
      });

      await logAudit(tx, {
        actorId: user.id,
        action: AUDIT_ACTIONS.ANNOUNCEMENT.DELETED,
        entityType: "ANNOUNCEMENT",
        entityId: announcement.id,
        clubId,
        metadata: {
          title: announcement.title,
          audience: announcement.audience,
        },
      });
    });

    return ok({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
