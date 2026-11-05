import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/get-current-user";
import { requireProfileComplete } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api/response";
import { notFound, conflict, invalidState } from "@/lib/api/errors";
import { logAudit } from "@/lib/audit/log";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { notifyUsers } from "@/lib/notifications/notify";
import { membershipQuerySchema } from "@/lib/validation/membership";

interface RouteParams {
  params: Promise<{
    clubId: string;
  }>;
}

/**
 * POST /api/clubs/[clubId]/members
 * Request to join a club.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser();
    requireProfileComplete(user);
    const { clubId } = await params;

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, name: true, status: true },
    });

    if (!club) {
      throw notFound("Club not found");
    }

    if (club.status !== "ACTIVE") {
      throw invalidState("Club is not accepting new members");
    }

    const existingMembership = await prisma.membership.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId: user.id,
        },
      },
    });

    if (existingMembership) {
      if (existingMembership.status === "PENDING" || existingMembership.status === "ACTIVE") {
        throw conflict("You already have an active or pending membership in this club");
      }
    }

    const membership = await prisma.$transaction(async (tx) => {
      let record;
      if (existingMembership && existingMembership.status === "REMOVED") {
        record = await tx.membership.update({
          where: { id: existingMembership.id },
          data: {
            status: "PENDING",
            role: "MEMBER",
            joinedAt: null,
            removedAt: null,
          },
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        });
      } else {
        record = await tx.membership.create({
          data: {
            clubId,
            userId: user.id,
            role: "MEMBER",
            status: "PENDING",
          },
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        });
      }

      await logAudit(tx, {
        action: AUDIT_ACTIONS.MEMBERSHIP.REQUESTED,
        entityType: "membership",
        entityId: record.id,
        actorId: user.id,
        clubId: club.id,
        metadata: {
          isReapplication: existingMembership?.status === "REMOVED",
        },
      });

      return record;
    });

    // Notify club managers asynchronously
    const managers = await prisma.membership.findMany({
      where: {
        clubId,
        status: "ACTIVE",
        role: { in: ["PRESIDENT", "SECRETARY"] },
      },
      select: { userId: true },
    });

    const managerIds = managers.map((m) => m.userId);
    if (managerIds.length > 0) {
      notifyUsers(managerIds, {
        type: "MEMBERSHIP_REQUEST",
        title: "New Membership Request",
        body: `${user.name} has requested to join ${club.name}`,
        href: `/clubs/${clubId}?tab=members`,
      }).catch((err) => {
        console.error("Failed to deliver membership request notifications:", err);
      });
    }

    return ok(membership, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}

/**
 * GET /api/clubs/[clubId]/members
 * Club roster (?status=ACTIVE|PENDING).
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { clubId } = await params;

    const url = new URL(req.url);
    const query = membershipQuerySchema.parse({
      status: url.searchParams.get("status") || "ACTIVE",
    });

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, advisorId: true },
    });

    if (!club) {
      throw notFound("Club not found");
    }

    const isAdmin = user.role === "ADMIN";
    const isAdvisor = club.advisorId === user.id;

    const callerMembership = await prisma.membership.findFirst({
      where: {
        clubId,
        userId: user.id,
        status: "ACTIVE",
      },
      select: { role: true },
    });

    const isPresident = callerMembership?.role === "PRESIDENT";
    const isSecretary = callerMembership?.role === "SECRETARY";
    const isTreasurer = callerMembership?.role === "TREASURER";
    const isMember = !!callerMembership;
    const isManager = isPresident || isSecretary;
    const isOfficer = isPresident || isSecretary || isTreasurer;

    // Unauthorized viewers receive 404
    if (!isAdmin && !isAdvisor && !isMember) {
      throw notFound("Club not found");
    }

    // PENDING list: managers and admin only. Everyone else: 404.
    if (query.status === "PENDING" && !isManager && !isAdmin) {
      throw notFound("Club not found");
    }

    // Field visibility: managers, officers, advisor, and admin also see email and student ID.
    // Regular members see name, role, and joined date only.
    const canSeeFullDetails = isManager || isOfficer || isAdvisor || isAdmin;

    const members = await prisma.membership.findMany({
      where: {
        clubId,
        status: query.status,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            ...(canSeeFullDetails ? { email: true, studentId: true } : {}),
          },
        },
      },
      orderBy: [
        { role: "asc" },
        { joinedAt: "asc" },
      ],
    });

    return ok(members);
  } catch (err) {
    return handleError(err);
  }
}
