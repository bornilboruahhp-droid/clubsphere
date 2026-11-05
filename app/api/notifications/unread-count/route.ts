import { requireUser } from "@/lib/auth/get-current-user";
import { ok, handleError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireUser();

    const count = await prisma.notification.count({
      where: {
        userId: user.id,
        readAt: null,
      },
    });

    return ok({ count });
  } catch (err) {
    return handleError(err);
  }
}
