import { requireUser } from "@/lib/auth/get-current-user";
import { ok, handleError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const user = await requireUser();

    const result = await prisma.notification.updateMany({
      where: {
        userId: user.id,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return ok({ count: result.count });
  } catch (err) {
    return handleError(err);
  }
}
