import { NextRequest } from "next/server";
import { getCurrentUser, requireUser, isProfileComplete } from "@/lib/auth/get-current-user";
import { unauthenticated, conflict } from "@/lib/api/errors";
import { ok, handleError } from "@/lib/api/response";
import { profileSchema } from "@/lib/validation/profile";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/log";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw unauthenticated("User authentication required");
    }

    return ok({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.studentId,
      department: user.department,
      profileComplete: isProfileComplete(user),
    });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();

    const body = await req.json();
    const validated = profileSchema.parse(body);

    // Check studentId uniqueness across other users
    const existing = await prisma.user.findFirst({
      where: {
        studentId: validated.studentId,
        id: { not: user.id },
      },
    });

    if (existing) {
      throw conflict("Student ID is already registered to another account", {
        studentId: "This Student ID is already taken",
      });
    }

    // Determine changed field names (metadata records field names, not values)
    const changedFields: string[] = [];
    if (user.studentId !== validated.studentId) {
      changedFields.push("studentId");
    }
    if (user.department !== validated.department) {
      changedFields.push("department");
    }

    // Execute database mutation and audit log insertion inside a single transaction
    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: user.id },
        data: {
          studentId: validated.studentId,
          department: validated.department,
        },
      });

      await logAudit(tx, {
        actorId: user.id,
        action: AUDIT_ACTIONS.USER.PROFILE_UPDATED,
        entityType: "User",
        entityId: user.id,
        metadata: {
          changedFields,
        },
      });

      return updated;
    });

    return ok({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      studentId: updatedUser.studentId,
      department: updatedUser.department,
      profileComplete: isProfileComplete(updatedUser),
    });
  } catch (err) {
    return handleError(err);
  }
}
