import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/get-current-user";
import { requireClubManager } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api/response";
import { notFound, invalidState } from "@/lib/api/errors";
import { logAudit } from "@/lib/audit/log";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { objectiveUpdateSchema } from "@/lib/validation/objective";

interface RouteParams {
  params: Promise<{
    clubId: string;
    objectiveId: string;
  }>;
}

/**
 * PATCH /api/clubs/[clubId]/objectives/[objectiveId]
 * Edit objective title, description, status, or target date.
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { clubId, objectiveId } = await params;

    await requireClubManager(user, clubId);

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, status: true },
    });

    if (!club) {
      throw notFound("Club not found");
    }

    if (club.status !== "ACTIVE") {
      throw invalidState("Objectives can only be modified for active clubs");
    }

    const existing = await prisma.clubObjective.findFirst({
      where: { id: objectiveId, clubId },
    });

    if (!existing) {
      throw notFound("Objective not found");
    }

    const body = objectiveUpdateSchema.parse(await req.json());

    const updated = await prisma.$transaction(async (tx) => {
      const data: Record<string, any> = {};
      const changedFields: string[] = [];

      if (body.title !== undefined && body.title !== existing.title) {
        data.title = body.title;
        changedFields.push("title");
      }
      if (body.description !== undefined && body.description !== existing.description) {
        data.description = body.description;
        changedFields.push("description");
      }
      if (body.status !== undefined && body.status !== existing.status) {
        data.status = body.status;
        changedFields.push("status");
      }
      if (body.targetDate !== undefined) {
        data.targetDate = body.targetDate;
        changedFields.push("targetDate");
      }

      const res = await tx.clubObjective.update({
        where: { id: existing.id },
        data,
      });

      await logAudit(tx, {
        action: AUDIT_ACTIONS.OBJECTIVE.UPDATED,
        entityType: "objective",
        entityId: existing.id,
        actorId: user.id,
        clubId,
        metadata: {
          changedFields,
          previousStatus: existing.status,
          newStatus: res.status,
        },
      });

      return res;
    });

    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}

/**
 * DELETE /api/clubs/[clubId]/objectives/[objectiveId]
 * Delete a club objective and cascaded updates.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { clubId, objectiveId } = await params;

    await requireClubManager(user, clubId);

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, status: true },
    });

    if (!club) {
      throw notFound("Club not found");
    }

    if (club.status !== "ACTIVE") {
      throw invalidState("Objectives can only be deleted from active clubs");
    }

    const existing = await prisma.clubObjective.findFirst({
      where: { id: objectiveId, clubId },
    });

    if (!existing) {
      throw notFound("Objective not found");
    }

    await prisma.$transaction(async (tx) => {
      await tx.clubObjective.delete({
        where: { id: existing.id },
      });

      await logAudit(tx, {
        action: AUDIT_ACTIONS.OBJECTIVE.DELETED,
        entityType: "objective",
        entityId: existing.id,
        actorId: user.id,
        clubId,
        metadata: {
          title: existing.title,
        },
      });
    });

    return ok({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
