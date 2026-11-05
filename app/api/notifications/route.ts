import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/get-current-user";
import { paginated, handleError } from "@/lib/api/response";
import { notificationQuerySchema } from "@/lib/validation/notifications";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();

    const searchParams = Object.fromEntries(req.nextUrl.searchParams);
    const { cursor, limit, unread } = notificationQuerySchema.parse(searchParams);

    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        ...(unread ? { readAt: null } : {}),
      },
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        href: true,
        readAt: true,
        createdAt: true,
      },
    });

    let nextCursor: string | null = null;
    if (notifications.length > limit) {
      const nextItem = notifications.pop();
      nextCursor = nextItem?.id ?? null;
    }

    return paginated(notifications, nextCursor);
  } catch (err) {
    return handleError(err);
  }
}
