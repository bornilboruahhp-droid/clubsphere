import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/get-current-user";
import { requireClubManager } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api/response";
import { notFound, conflict, invalidState } from "@/lib/api/errors";
import { logAudit } from "@/lib/audit/log";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { objectiveCreateSchema } from "@/lib/validation/objective";

interface RouteParams {
  params: Promise<{
    clubId: string;
  }>;
}

/**
 * GET /api/clubs/[clubId]/objectives
 * Read club objectives with latest progress note and update count.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { clubId } = await params;

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

    const objectives = await prisma.clubObjective.findMany({
      where: { clubId },
      include: {
        updates: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            author: {
              select: { id: true, name: true },
            },
          },
        },
        _count: {
          select: { updates: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return ok(objectives);
  } catch (err) {
    return handleError(err);
  }
}

/**
 * POST /api/clubs/[clubId]/objectives
 * Create a new objective for an active club (max 20 per club).
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { clubId } = await params;

    await requireClubManager(user, clubId);

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, status: true },
    });

    if (!club) {
      throw notFound("Club not found");
    }

    if (club.status !== "ACTIVE") {
      throw invalidState("Objectives can only be added to active clubs");
    }

    const body = objectiveCreateSchema.parse(await req.json());

    const created = await prisma.$transaction(async (tx) => {
      const currentCount = await tx.clubObjective.count({
        where: { clubId },
      });

      if (currentCount >= 20) {
        throw conflict("A club may have at most 20 objectives");
      }

      const objective = await tx.clubObjective.create({
        data: {
          clubId,
          title: body.title,
          description: body.description,
          targetDate: body.targetDate,
          status: "PLANNED",
        },
      });

      await logAudit(tx, {
        action: AUDIT_ACTIONS.OBJECTIVE.CREATED,
        entityType: "objective",
        entityId: objective.id,
        actorId: user.id,
        clubId,
        metadata: {
          title: objective.title,
        },
      });

      return objective;
    });

    return ok(created, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
