import { NextRequest } from "next/server";
import { z } from "zod";
import { PlatformRole, ApprovalStage, ApprovalDecision } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/get-current-user";
import { requireAdmin } from "@/lib/access";
import { notFound, invalidState, validationError } from "@/lib/api/errors";
import { ok, handleError } from "@/lib/api/response";
import { logAudit } from "@/lib/audit/log";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { notifyUser } from "@/lib/notifications/notify";

interface RouteParams {
  params: Promise<{
    clubId: string;
  }>;
}

const changeAdvisorSchema = z.object({
  advisorId: z
    .string({ required_error: "Advisor ID is required" })
    .uuid("Invalid advisor ID format"),
});

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireUser();
    requireAdmin(user);

    const { clubId } = await params;
    const body = await request.json().catch(() => ({}));
    const parseResult = changeAdvisorSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || "Invalid advisor ID";
      throw validationError(firstError);
    }

    const { advisorId } = parseResult.data;

    // 1. Verify club exists and is in allowed status (PENDING or ACTIVE)
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        advisor: {
          select: { id: true, name: true },
        },
      },
    });

    if (!club) {
      throw notFound("Club not found");
    }

    if (club.status !== "PENDING" && club.status !== "ACTIVE") {
      throw invalidState(
        `Faculty advisor cannot be reassigned for clubs with status "${club.status}". Only PENDING or ACTIVE clubs can be reassigned.`
      );
    }

    // If new advisor is the same as current advisor, no-op
    if (club.advisorId === advisorId) {
      return ok(club);
    }

    // 2. Verify new advisor exists and has platform role ADVISOR
    const newAdvisor = await prisma.user.findUnique({
      where: { id: advisorId },
      select: { id: true, name: true, role: true },
    });

    if (!newAdvisor) {
      throw notFound("New advisor user not found");
    }

    if (newAdvisor.role !== PlatformRole.ADVISOR) {
      throw validationError(
        `User ${newAdvisor.name} does not hold the platform role of ADVISOR (current role: ${newAdvisor.role})`
      );
    }

    const oldAdvisorId = club.advisorId;
    const oldAdvisorName = club.advisor.name;

    // 3. Reassign advisor within transaction and handle pending approval inheritance
    const updated = await prisma.$transaction(async (tx) => {
      const updatedClub = await tx.club.update({
        where: { id: clubId },
        data: { advisorId },
        select: {
          id: true,
          name: true,
          status: true,
          advisorId: true,
          updatedAt: true,
        },
      });

      // If an ADVISOR stage review is pending, new advisor inherits it
      await tx.clubApproval.updateMany({
        where: {
          clubId,
          stage: ApprovalStage.ADVISOR,
          decision: ApprovalDecision.PENDING,
        },
        data: {
          reviewerId: advisorId,
        },
      });

      await logAudit(tx, {
        actorId: user.id,
        action: AUDIT_ACTIONS.CLUB.ADVISOR_CHANGED,
        entityType: "CLUB",
        entityId: clubId,
        clubId,
        metadata: {
          oldAdvisorId,
          newAdvisorId: advisorId,
          oldAdvisorName,
          newAdvisorName: newAdvisor.name,
        },
      });

      return updatedClub;
    });

    // Notify old and new advisors after transaction commits
    await notifyUser({
      userId: oldAdvisorId,
      type: "ROLE_CHANGED",
      title: "Faculty Advisor Role Reassigned",
      body: `You are no longer the faculty sponsor for ${club.name}. Campus administration has reassigned the role.`,
      href: `/clubs/${club.id}`,
    });

    await notifyUser({
      userId: advisorId,
      type: "ROLE_CHANGED",
      title: "Assigned as Faculty Advisor",
      body: `You have been assigned as the faculty advisor for ${club.name}.`,
      href: `/clubs/${club.id}`,
    });

    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}
