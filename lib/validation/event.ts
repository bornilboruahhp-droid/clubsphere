import { z } from "zod";

export const eventVisibilitySchema = z.enum(["CAMPUS", "MEMBERS_ONLY"]);
export const eventStatusSchema = z.enum(["PUBLISHED", "CANCELLED", "COMPLETED"]);

export const eventCreateSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Title must be at least 3 characters")
      .max(120, "Title must not exceed 120 characters"),
    description: z
      .string()
      .trim()
      .min(1, "Description is required")
      .max(2000, "Description must not exceed 2000 characters"),
    location: z
      .string()
      .trim()
      .min(2, "Location must be at least 2 characters")
      .max(200, "Location must not exceed 200 characters"),
    startsAt: z.string().datetime({ message: "Invalid startsAt date format" }),
    endsAt: z.string().datetime({ message: "Invalid endsAt date format" }),
    capacity: z
      .number()
      .int()
      .min(1, "Capacity must be at least 1")
      .max(10000, "Capacity must not exceed 10000")
      .nullable()
      .optional(),
    visibility: eventVisibilitySchema.default("CAMPUS"),
  })
  .refine(
    (data) => new Date(data.startsAt) > new Date(),
    {
      message: "Event start time must be in the future",
      path: ["startsAt"],
    }
  )
  .refine(
    (data) => new Date(data.endsAt) > new Date(data.startsAt),
    {
      message: "Event end time must be after the start time",
      path: ["endsAt"],
    }
  );

export type EventCreateInput = z.infer<typeof eventCreateSchema>;

export const eventUpdateSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Title must be at least 3 characters")
      .max(120, "Title must not exceed 120 characters")
      .optional(),
    description: z
      .string()
      .trim()
      .min(1, "Description cannot be empty")
      .max(2000, "Description must not exceed 2000 characters")
      .optional(),
    location: z
      .string()
      .trim()
      .min(2, "Location must be at least 2 characters")
      .max(200, "Location must not exceed 200 characters")
      .optional(),
    startsAt: z.string().datetime({ message: "Invalid startsAt date format" }).optional(),
    endsAt: z.string().datetime({ message: "Invalid endsAt date format" }).optional(),
    capacity: z
      .number()
      .int()
      .min(1, "Capacity must be at least 1")
      .max(10000, "Capacity must not exceed 10000")
      .nullable()
      .optional(),
    visibility: eventVisibilitySchema.optional(),
  })
  .refine(
    (data) => {
      if (data.startsAt && data.endsAt) {
        return new Date(data.endsAt) > new Date(data.startsAt);
      }
      return true;
    },
    {
      message: "Event end time must be after the start time",
      path: ["endsAt"],
    }
  );

export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;

export const eventStatusChangeSchema = z.object({
  status: eventStatusSchema,
});

export type EventStatusChangeInput = z.infer<typeof eventStatusChangeSchema>;

export const eventFeedQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  clubId: z.string().uuid().optional(),
  q: z.string().trim().optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type EventFeedQueryInput = z.infer<typeof eventFeedQuerySchema>;
