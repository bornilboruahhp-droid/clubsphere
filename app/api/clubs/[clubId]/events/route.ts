import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/get-current-user";
import { requireClubManager } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api/response";
import { notFound, invalidState } from "@/lib/api/errors";
import { logAudit } from "@/lib/audit/log";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { eventCreateSchema } from "@/lib/validation/event";

interface RouteParams {
  params: Promise<{
    clubId: string;
  }>;
}

/**
 * POST /api/clubs/[clubId]/events
 * Create a DRAFT event for an active club.
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
      throw invalidState("Events can only be created for active clubs");
    }

    const body = eventCreateSchema.parse(await req.json());

    const created = await prisma.$transaction(async (tx) => {
      const event = await tx.event.create({
        data: {
          clubId,
          createdById: user.id,
          title: body.title,
          description: body.description,
          location: body.location,
          startsAt: new Date(body.startsAt),
          endsAt: new Date(body.endsAt),
          capacity: body.capacity ?? null,
          visibility: body.visibility,
          status: "DRAFT",
        },
      });

      await logAudit(tx, {
        action: AUDIT_ACTIONS.EVENT.CREATED,
        entityType: "event",
        entityId: event.id,
        actorId: user.id,
        clubId,
        metadata: {
          title: event.title,
          startsAt: event.startsAt.toISOString(),
          visibility: event.visibility,
        },
      });

      return event;
    });

    return ok(created, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}

/**
 * GET /api/clubs/[clubId]/events
 * List club events according to caller's role (managers see DRAFTs, members see MEMBERS_ONLY).
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

    const isAdmin = user.role === "ADMIN";
    const isAdvisor = club.advisorId === user.id;
    const isProposer = club.proposerId === user.id;

    const callerMembership = await prisma.membership.findFirst({
      where: {
        clubId,
        userId: user.id,
        status: "ACTIVE",
      },
      select: { role: true },
    });

    const isMember = !!callerMembership;
    const isManager =
      isAdmin ||
      callerMembership?.role === "PRESIDENT" ||
      callerMembership?.role === "SECRETARY";

    // Non-active clubs require member/advisor/proposer/admin access
    if (club.status !== "ACTIVE" && !isAdmin && !isAdvisor && !isProposer && !isMember) {
      throw notFound("Club not found");
    }

    // Determine query filter based on caller's role
    const whereClause: any = { clubId };

    if (!isManager) {
      // Non-managers cannot view DRAFT events
      whereClause.status = { not: "DRAFT" };

      if (!isMember && !isAdvisor && !isAdmin) {
        // Non-members only see CAMPUS visibility
        whereClause.visibility = "CAMPUS";
      }
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            registrations: {
              where: {
                status: { not: "CANCELLED" },
              },
            },
          },
        },
      },
      orderBy: {
        startsAt: "desc",
      },
    });

    return ok(events);
  } catch (err) {
    return handleError(err);
  }
}
