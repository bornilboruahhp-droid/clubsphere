import { NextRequest } from "next/server";
import { z } from "zod";
import { PlatformRole, ClubStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/get-current-user";
import { requireAdmin } from "@/lib/access";
import { notFound, conflict, validationError } from "@/lib/api/errors";
import { ok, handleError } from "@/lib/api/response";
import { logAudit } from "@/lib/audit/log";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { notifyUser } from "@/lib/notifications/notify";

interface RouteParams {
  params: Promise<{
    userId: string;
  }>;
}

const updateRoleSchema = z.object({
  role: z.nativeEnum(PlatformRole, {
    errorMap: () => ({ message: "Role must be STUDENT, ADVISOR, or ADMIN" }),
  }),
});

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const actor = await requireUser();
    requireAdmin(actor);

    const { userId } = await params;
    const body = await request.json().catch(() => ({}));
    const parseResult = updateRoleSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || "Invalid role";
      throw validationError(firstError);
    }

    const { role: newRole } = parseResult.data;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!targetUser) {
      throw notFound("User not found");
    }

    // No-op if target already has the requested role
    if (targetUser.role === newRole) {
      return ok(targetUser);
    }

    // Invariant 1: An admin cannot remove their own admin role if they are the last admin
    if (targetUser.id === actor.id && targetUser.role === PlatformRole.ADMIN && newRole !== PlatformRole.ADMIN) {
      const adminCount = await prisma.user.count({
        where: { role: PlatformRole.ADMIN },
      });
      if (adminCount <= 1) {
        throw conflict(
          "Cannot demote the last platform administrator. Assign another administrator before changing this account."
        );
      }
    }

    // Invariant 2: A user who is the assigned advisor of any PENDING or ACTIVE club cannot be moved away from ADVISOR
    if (targetUser.role === PlatformRole.ADVISOR && newRole !== PlatformRole.ADVISOR) {
      const assignedClubs = await prisma.club.findMany({
        where: {
          advisorId: userId,
          status: { in: [ClubStatus.PENDING, ClubStatus.ACTIVE] },
        },
        select: { name: true },
      });

      if (assignedClubs.length > 0) {
        const clubNames = assignedClubs.map((c) => c.name).join(", ");
        throw conflict(
          `Cannot change role. This user is the active faculty advisor for: ${clubNames}. Please reassign those clubs first.`
        );
      }
    }

    const oldRole = targetUser.role;

    const updated = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { role: newRole },
        select: {
          id: true,
          name: true,
          email: true,
          studentId: true,
          department: true,
          role: true,
          updatedAt: true,
        },
      });

      await logAudit(tx, {
        actorId: actor.id,
        action: AUDIT_ACTIONS.USER.ROLE_CHANGED,
        entityType: "USER",
        entityId: userId,
        metadata: {
          oldRole,
          newRole,
          targetEmail: targetUser.email,
        },
      });

      return updatedUser;
    });

    // Notify the target user of their updated role
    await notifyUser({
      userId,
      type: "ROLE_CHANGED",
      title: "Platform Role Updated",
      body: `Your campus platform role has been updated from ${oldRole} to ${newRole}.`,
      href: "/profile",
    });

    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}
