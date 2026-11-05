import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/get-current-user";
import { notFound } from "@/lib/api/errors";
import { ok, handleError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ notificationId: string }> }
) {
  try {
    const user = await requireUser();
    const { notificationId } = await context.params;

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: {
        id: true,
        userId: true,
        readAt: true,
      },
    });

    if (!notification || notification.userId !== user.id) {
      throw notFound("Notification not found");
    }

    if (!notification.readAt) {
      const updated = await prisma.notification.update({
        where: { id: notificationId },
        data: {
          readAt: new Date(),
        },
        select: {
          id: true,
          readAt: true,
        },
      });

      return ok({ id: updated.id, readAt: updated.readAt });
    }

    return ok({ id: notification.id, readAt: notification.readAt });
  } catch (err) {
    return handleError(err);
  }
}
