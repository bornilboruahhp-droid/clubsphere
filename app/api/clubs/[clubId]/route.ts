import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/get-current-user";
import { requireClubPresident } from "@/lib/access";
import { notFound, conflict, invalidState } from "@/lib/api/errors";
import { ok, handleError } from "@/lib/api/response";
import { clubProfileUpdateSchema } from "@/lib/validation/club";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/log";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ clubId: string }> }
) {
  try {
    const user = await requireUser();
    const { clubId } = await context.params;

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        proposerId: true,
        advisorId: true,
        createdAt: true,
        updatedAt: true,
        proposer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        advisor: {
          select: {
            id: true,
            name: true,
            department: true,
          },
        },
        objectives: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            targetDate: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        approvals: {
          select: {
            id: true,
            stage: true,
            decision: true,
            comment: true,
            decidedAt: true,
            createdAt: true,
            reviewer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        memberships: {
          where: {
            userId: user.id,
          },
          select: {
            id: true,
            role: true,
            status: true,
            joinedAt: true,
          },
        },
        _count: {
          select: {
            memberships: {
              where: {
                status: "ACTIVE",
              },
            },
          },
        },
      },
    });

    if (!club) {
      throw notFound("Club not found");
    }

    const isAdmin = user.role === "ADMIN";
    const isProposer = club.proposerId === user.id;
    const isAdvisor = club.advisorId === user.id;
    const userMembership = club.memberships[0] ?? null;
    const isActiveMember = userMembership?.status === "ACTIVE";

    // Proposer, assigned advisor, and admin can view pending/rejected clubs & approval records
    const canViewReviewDetails = isProposer || isAdvisor || isAdmin;

    // Visibility rules
    if (club.status === "ACTIVE") {
      // Allowed for any signed-in user
    } else if (club.status === "SUSPENDED") {
      // Allowed for members and admins only
      if (!isActiveMember && !isAdmin) {
        throw notFound("Club not found");
      }
    } else if (club.status === "PENDING" || club.status === "REJECTED") {
      // Allowed for proposer, assigned advisor, and admin only
      if (!canViewReviewDetails) {
        throw notFound("Club not found");
      }
    }

    const data: Record<string, any> = {
      id: club.id,
      name: club.name,
      description: club.description,
      status: club.status,
      createdAt: club.createdAt,
      updatedAt: club.updatedAt,
      proposer: club.proposer,
      advisor: club.advisor,
      objectives: club.objectives,
      activeMemberCount: club._count.memberships,
      myMembership: userMembership,
    };

    // Include approval stages and decisions only for those authorized to view review details
    if (canViewReviewDetails) {
      data.approvals = club.approvals;
    }

    return ok(data);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ clubId: string }> }
) {
  try {
    const user = await requireUser();
    const { clubId } = await context.params;

    // Check president (or admin) authorization
    await requireClubPresident(user, clubId);

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
      },
    });

    if (!club) {
      throw notFound("Club not found");
    }

    // Status editing restrictions
    if (user.role !== "ADMIN" && club.status !== "ACTIVE") {
      throw invalidState("Club profile can only be edited when the club is ACTIVE");
    }

    if (user.role === "ADMIN" && club.status === "REJECTED") {
      throw invalidState("REJECTED clubs cannot be edited");
    }

    const body = await req.json();
    const validated = clubProfileUpdateSchema.parse(body);

    // Case-insensitive duplicate check across other clubs
    const existing = await prisma.club.findFirst({
      where: {
        id: { not: clubId },
        name: {
          equals: validated.name,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (existing) {
      throw conflict("A club with this name already exists", {
        name: "This club name is already taken",
      });
    }

    // Determine changed field names
    const changedFields: string[] = [];
    if (club.name !== validated.name) {
      changedFields.push("name");
    }
    if (club.description !== validated.description) {
      changedFields.push("description");
    }

    if (changedFields.length === 0) {
      return ok(club);
    }

    // Execute update and audit log in a single transaction
    const updated = await prisma.$transaction(async (tx) => {
      const updatedClub = await tx.club.update({
        where: { id: clubId },
        data: {
          name: validated.name,
          description: validated.description,
        },
      });

      await logAudit(tx, {
        actorId: user.id,
        action: AUDIT_ACTIONS.CLUB.PROFILE_UPDATED,
        entityType: "Club",
        entityId: club.id,
        clubId: club.id,
        metadata: {
          changedFields,
        },
      });

      return updatedClub;
    });

    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}

