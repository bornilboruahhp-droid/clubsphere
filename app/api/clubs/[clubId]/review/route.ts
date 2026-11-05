import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/get-current-user";
import { forbidden, notFound, invalidState } from "@/lib/api/errors";
import { ok, handleError } from "@/lib/api/response";
import { clubReviewSchema } from "@/lib/validation/club";
import { prisma } from "@/lib/prisma";
import { canTransition } from "@/lib/clubs/transitions";
import { logAudit } from "@/lib/audit/log";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { notifyUser, notifyUsers } from "@/lib/notifications/notify";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ clubId: string }> }
) {
  try {
    const user = await requireUser();
    const { clubId } = await context.params;

    const body = await req.json();
    const validated = clubReviewSchema.parse(body);

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        approvals: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!club) {
      throw notFound("Club not found");
    }

    if (club.status !== "PENDING") {
      throw invalidState("Club is not in PENDING status");
    }

    // Determine current pending approval stage
    const pendingApproval = club.approvals.find((a) => a.decision === "PENDING");
    if (!pendingApproval) {
      throw invalidState("No pending approval stage found for this club");
    }

    // Validate authorization for this stage
    if (pendingApproval.stage === "ADVISOR") {
      if (club.advisorId !== user.id) {
        throw forbidden("Only the assigned faculty advisor can review this stage");
      }
    } else if (pendingApproval.stage === "ADMIN") {
      if (user.role !== "ADMIN") {
        throw forbidden("Only platform administrators can review this stage");
      }
    }

    // Perform database mutation in an atomic transaction
    const { newClubStatus, isAdvisorApproved, isFinalDecision } =
      await prisma.$transaction(async (tx) => {
        // 1. Update the approval row
        await tx.clubApproval.update({
          where: { id: pendingApproval.id },
          data: {
            decision: validated.decision,
            reviewerId: user.id,
            comment: validated.comment ?? null,
            decidedAt: new Date(),
          },
        });

        // 2. Log approval.decided audit entry
        await logAudit(tx, {
          actorId: user.id,
          action: AUDIT_ACTIONS.APPROVAL.DECIDED,
          entityType: "ClubApproval",
          entityId: pendingApproval.id,
          clubId: club.id,
          metadata: {
            stage: pendingApproval.stage,
            decision: validated.decision,
            comment: validated.comment ?? null,
          },
        });

        let updatedStatus = club.status;
        let advisorApproved = false;
        let finalDecision = false;

        if (validated.decision === "APPROVED") {
          if (pendingApproval.stage === "ADVISOR") {
            // Create ADMIN approval row with decision PENDING
            await tx.clubApproval.create({
              data: {
                clubId: club.id,
                stage: "ADMIN",
                decision: "PENDING",
              },
            });
            advisorApproved = true;
          } else if (pendingApproval.stage === "ADMIN") {
            // Final approval: transition club to ACTIVE
            if (!canTransition(club.status, "ACTIVE")) {
              throw invalidState("Cannot transition club to ACTIVE");
            }

            await tx.club.update({
              where: { id: club.id },
              data: { status: "ACTIVE" },
            });

            await logAudit(tx, {
              actorId: user.id,
              action: AUDIT_ACTIONS.CLUB.ACTIVATED,
              entityType: "Club",
              entityId: club.id,
              clubId: club.id,
              metadata: {
                previousStatus: club.status,
                newStatus: "ACTIVE",
              },
            });

            updatedStatus = "ACTIVE";
            finalDecision = true;
          }
        } else if (validated.decision === "REJECTED") {
          // Rejection at either stage transitions club to REJECTED
          if (!canTransition(club.status, "REJECTED")) {
            throw invalidState("Cannot transition club to REJECTED");
          }

          await tx.club.update({
            where: { id: club.id },
            data: { status: "REJECTED" },
          });

          await logAudit(tx, {
            actorId: user.id,
            action: AUDIT_ACTIONS.CLUB.REJECTED,
            entityType: "Club",
            entityId: club.id,
            clubId: club.id,
            metadata: {
              stage: pendingApproval.stage,
              previousStatus: club.status,
              newStatus: "REJECTED",
              comment: validated.comment,
            },
          });

          updatedStatus = "REJECTED";
          finalDecision = true;
        }

        return {
          newClubStatus: updatedStatus,
          isAdvisorApproved: advisorApproved,
          isFinalDecision: finalDecision,
        };
      });

    // Post-commit side effects: asynchronous notification dispatch
    if (isAdvisorApproved) {
      // Notify all admins that club is ready for administrative review
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });

      await notifyUsers(
        admins.map((a) => a.id),
        {
          type: "CLUB_REVIEW_REQUESTED",
          title: `Club charter ready for admin review: ${club.name}`,
          body: `Advisor approved "${club.name}". Administrative review required.`,
          href: "/reviews",
        }
      );
    } else if (isFinalDecision) {
      // Notify the proposer of the final decision
      const isApproved = validated.decision === "APPROVED";
      await notifyUser({
        userId: club.proposerId,
        type: "CLUB_DECISION",
        title: isApproved
          ? `Club Approved: ${club.name}`
          : `Club Registration Rejected: ${club.name}`,
        body: isApproved
          ? `Congratulations! "${club.name}" has received administrative recognition and is now active.`
          : `Your registration for "${club.name}" was rejected${validated.comment ? `: "${validated.comment}"` : "."}`,
        href: `/clubs/${club.id}`,
      });
    }

    return ok({
      success: true,
      clubStatus: newClubStatus,
    });
  } catch (err) {
    return handleError(err);
  }
}
