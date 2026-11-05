import { z } from "zod";

export const notificationQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unread: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
});

export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;
