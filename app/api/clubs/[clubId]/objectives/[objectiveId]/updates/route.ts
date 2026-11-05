import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/get-current-user";
import { requireClubManager } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api/response";
import { notFound, invalidState } from "@/lib/api/errors";
import { logAudit } from "@/lib/audit/log";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { objectiveProgressSchema } from "@/lib/validation/objective";

interface RouteParams {
  params: Promise<{
    clubId: string;
    objectiveId: string;
  }>;
}

/**
 * GET /api/clubs/[clubId]/objectives/[objectiveId]/updates
 * Progress timeline (newest first) for an objective.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { clubId, objectiveId } = await params;

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, status: true, advisorId: true, proposerId: true },
    });

    if (!club) {
      throw notFound("Club not found");
    }

    if (club.status !== "ACTIVE") {
      const isAdmin = user.role === "ADMIN";
      const isAdvisor = club.advisorId === user.id;
      const isProposer = club.proposerId === user.id;
      const membership = await prisma.membership.findFirst({
        where: { clubId, userId: user.id, status: "ACTIVE" },
      });

      if (!isAdmin && !isAdvisor && !isProposer && !membership) {
        throw notFound("Club not found");
      }
    }

    const objective = await prisma.clubObjective.findFirst({
      where: { id: objectiveId, clubId },
      select: { id: true },
    });

    if (!objective) {
      throw notFound("Objective not found");
    }

    const updates = await prisma.clubObjectiveUpdate.findMany({
      where: { objectiveId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return ok(updates);
  } catch (err) {
    return handleError(err);
  }
}

/**
 * POST /api/clubs/[clubId]/objectives/[objectiveId]/updates
 * Add a progress note to an objective (with optional status update).
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
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
      throw invalidState("Progress updates can only be added to active clubs");
    }

    const objective = await prisma.clubObjective.findFirst({
      where: { id: objectiveId, clubId },
    });

    if (!objective) {
      throw notFound("Objective not found");
    }

    const body = objectiveProgressSchema.parse(await req.json());

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the progress update note
      const updateRecord = await tx.clubObjectiveUpdate.create({
        data: {
          objectiveId,
          authorId: user.id,
          note: body.note,
        },
        include: {
          author: {
            select: { id: true, name: true },
          },
        },
      });

      // 2. Optionally update objective status if provided and different
      if (body.status && body.status !== objective.status) {
        await tx.clubObjective.update({
          where: { id: objective.id },
          data: { status: body.status },
        });

        await logAudit(tx, {
          action: AUDIT_ACTIONS.OBJECTIVE.UPDATED,
          entityType: "objective",
          entityId: objective.id,
          actorId: user.id,
          clubId,
          metadata: {
            previousStatus: objective.status,
            newStatus: body.status,
            triggeredByProgressUpdateId: updateRecord.id,
          },
        });
      }

      // 3. Log progress added audit
      await logAudit(tx, {
        action: AUDIT_ACTIONS.OBJECTIVE.PROGRESS_ADDED,
        entityType: "objective_update",
        entityId: updateRecord.id,
        actorId: user.id,
        clubId,
        metadata: {
          objectiveId,
          noteLength: body.note.length,
          updatedStatus: body.status || null,
        },
      });

      return updateRecord;
    });

    return ok(result, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
