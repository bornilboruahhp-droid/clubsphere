import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api/response";
import { notFound, forbidden, invalidState, validationError } from "@/lib/api/errors";
import { logAudit } from "@/lib/audit/log";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { notifyUser } from "@/lib/notifications/notify";
import { membershipActionSchema } from "@/lib/validation/membership";

interface RouteParams {
  params: Promise<{
    clubId: string;
    membershipId: string;
  }>;
}

/**
 * PATCH /api/clubs/[clubId]/members/[membershipId]
 * Decide, change role, or remove a club membership.
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { clubId, membershipId } = await params;
    const body = membershipActionSchema.parse(await req.json());

    const target = await prisma.membership.findFirst({
      where: {
        id: membershipId,
        clubId,
      },
      include: {
        club: {
          select: { id: true, name: true, status: true },
        },
        user: {
          select: { id: true, name: true },
        },
      },
    });

    if (!target) {
      throw notFound("Membership not found");
    }

    const isAdmin = user.role === "ADMIN";
    const callerMembership = await prisma.membership.findFirst({
      where: {
        clubId,
        userId: user.id,
        status: "ACTIVE",
      },
      select: { role: true },
    });

    const isPresident = isAdmin || callerMembership?.role === "PRESIDENT";
    const isManager = isAdmin || callerMembership?.role === "PRESIDENT" || callerMembership?.role === "SECRETARY";

    if (body.action === "approve" || body.action === "reject") {
      if (!isManager) {
        throw forbidden("Manager privileges required to review membership requests");
      }

      if (target.status !== "PENDING") {
        throw invalidState("Membership is not pending review");
      }

      const isApprove = body.action === "approve";

      const updated = await prisma.$transaction(async (tx) => {
        const res = await tx.membership.update({
          where: { id: target.id },
          data: isApprove
            ? {
                status: "ACTIVE",
                joinedAt: new Date(),
                removedAt: null,
              }
            : {
                status: "REMOVED",
                removedAt: new Date(),
              },
        });

        await logAudit(tx, {
          action: isApprove
            ? AUDIT_ACTIONS.MEMBERSHIP.APPROVED
            : AUDIT_ACTIONS.MEMBERSHIP.REJECTED,
          entityType: "membership",
          entityId: target.id,
          actorId: user.id,
          clubId: target.clubId,
        });

        return res;
      });

      notifyUser({
        userId: target.userId,
        type: "MEMBERSHIP_DECISION",
        title: isApprove ? "Membership Approved" : "Membership Rejected",
        body: isApprove
          ? `Your request to join ${target.club.name} was approved.`
          : `Your request to join ${target.club.name} was rejected.`,
        href: isApprove ? `/clubs/${clubId}` : `/clubs`,
      }).catch((err) => {
        console.error("Failed to notify user of membership decision:", err);
      });

      return ok(updated);
    }

    if (body.action === "remove") {
      if (target.status !== "ACTIVE") {
        throw invalidState("Membership is not active");
      }

      if (target.role === "PRESIDENT") {
        throw validationError("The club president cannot be removed through this route");
      }

      if (target.role === "MEMBER") {
        if (!isManager) {
          throw forbidden("Manager privileges required to remove members");
        }
      } else if (target.role === "TREASURER" || target.role === "SECRETARY") {
        if (!isPresident) {
          throw forbidden("Only the club president or an administrator can remove officers");
        }
      }

      const updated = await prisma.$transaction(async (tx) => {
        const res = await tx.membership.update({
          where: { id: target.id },
          data: {
            status: "REMOVED",
            removedAt: new Date(),
          },
        });

        await logAudit(tx, {
          action: AUDIT_ACTIONS.MEMBERSHIP.REMOVED,
          entityType: "membership",
          entityId: target.id,
          actorId: user.id,
          clubId: target.clubId,
          metadata: {
            previousRole: target.role,
          },
        });

        return res;
      });

      notifyUser({
        userId: target.userId,
        type: "MEMBERSHIP_DECISION",
        title: "Membership Removed",
        body: `You have been removed from ${target.club.name}.`,
        href: `/clubs`,
      }).catch((err) => {
        console.error("Failed to notify user of removal:", err);
      });

      return ok(updated);
    }

    if (body.action === "set_role") {
      if (!isPresident) {
        throw forbidden("Only the club president or an administrator can change member roles");
      }

      if (target.status !== "ACTIVE") {
        throw invalidState("Role can only be changed for active members");
      }

      if (target.role === "PRESIDENT") {
        throw validationError("Presidency cannot be changed through this route");
      }

      let demotedPreviousHolderUserId: string | null = null;

      const updated = await prisma.$transaction(async (tx) => {
        if (body.role === "TREASURER" || body.role === "SECRETARY") {
          const previousHolder = await tx.membership.findFirst({
            where: {
              clubId,
              role: body.role,
              status: "ACTIVE",
              id: { not: target.id },
            },
          });

          if (previousHolder) {
            demotedPreviousHolderUserId = previousHolder.userId;
            await tx.membership.update({
              where: { id: previousHolder.id },
              data: { role: "MEMBER" },
            });

            await logAudit(tx, {
              action: AUDIT_ACTIONS.MEMBERSHIP.ROLE_CHANGED,
              entityType: "membership",
              entityId: previousHolder.id,
              actorId: user.id,
              clubId: target.clubId,
              metadata: {
                previousRole: body.role,
                newRole: "MEMBER",
                demotedByAssignment: true,
              },
            });
          }
        }

        const res = await tx.membership.update({
          where: { id: target.id },
          data: { role: body.role },
        });

        await logAudit(tx, {
          action: AUDIT_ACTIONS.MEMBERSHIP.ROLE_CHANGED,
          entityType: "membership",
          entityId: target.id,
          actorId: user.id,
          clubId: target.clubId,
          metadata: {
            previousRole: target.role,
            newRole: body.role,
          },
        });

        return res;
      });

      if (demotedPreviousHolderUserId) {
        notifyUser({
          userId: demotedPreviousHolderUserId,
          type: "ROLE_CHANGED",
          title: "Club Role Updated",
          body: `Your role in ${target.club.name} was changed to Member.`,
          href: `/clubs/${clubId}`,
        }).catch((err) => {
          console.error("Failed to notify demoted officer:", err);
        });
      }

      notifyUser({
        userId: target.userId,
        type: "ROLE_CHANGED",
        title: "Club Role Updated",
        body: `Your role in ${target.club.name} was changed to ${body.role}.`,
        href: `/clubs/${clubId}`,
      }).catch((err) => {
        console.error("Failed to notify target user of role change:", err);
      });

      return ok(updated);
    }

    throw validationError("Invalid action");
  } catch (err) {
    return handleError(err);
  }
}
