import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

export interface NotifyInput {
  type: NotificationType;
  title: string;
  body?: string | null;
  href?: string | null;
}

export interface NotifyUserInput extends NotifyInput {
  userId: string;
}

/**
 * Creates a single notification for a user.
 * Swallows and logs any error to ensure notification failures never throw to callers.
 */
export async function notifyUser(input: NotifyUserInput): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        href: input.href ?? null,
      },
    });
  } catch (error) {
    console.error(`[notifyUser] Failed to create notification for user ${input?.userId}:`, error);
  }
}

/**
 * Creates notifications for multiple users via createMany.
 * Swallows and logs any error to ensure notification failures never throw to callers.
 */
export async function notifyUsers(
  userIds: string[],
  input: NotifyInput
): Promise<void> {
  if (!userIds || userIds.length === 0) {
    return;
  }

  try {
    const uniqueUserIds = Array.from(new Set(userIds));
    await prisma.notification.createMany({
      data: uniqueUserIds.map((userId) => ({
        userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        href: input.href ?? null,
      })),
    });
  } catch (error) {
    console.error(
      `[notifyUsers] Failed to create notifications for ${userIds?.length} users:`,
      error
    );
  }
}
