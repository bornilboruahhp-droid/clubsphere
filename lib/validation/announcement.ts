import { z } from "zod";

export const announcementCreateSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Title must be at least 3 characters")
      .max(120, "Title cannot exceed 120 characters"),
    body: z
      .string()
      .trim()
      .min(3, "Body must be at least 3 characters")
      .max(2000, "Body cannot exceed 2000 characters"),
    audience: z.enum(["ALL_MEMBERS", "EVENT_REGISTRANTS"]),
    eventId: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.audience === "EVENT_REGISTRANTS") {
        return Boolean(data.eventId && data.eventId.trim().length > 0);
      }
      return true;
    },
    {
      message: "Event is required when audience is set to Event Registrants",
      path: ["eventId"],
    }
  );

export const announcementsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type AnnouncementCreateInput = z.infer<typeof announcementCreateSchema>;
export type AnnouncementsQueryInput = z.infer<typeof announcementsQuerySchema>;
