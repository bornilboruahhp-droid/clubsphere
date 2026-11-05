import { z } from "zod";

export const objectiveStatusSchema = z.enum([
  "PLANNED",
  "IN_PROGRESS",
  "ACHIEVED",
  "DROPPED",
]);

export const objectiveCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title must not exceed 120 characters"),
  description: z
    .string()
    .trim()
    .max(1000, "Description must not exceed 1000 characters")
    .optional()
    .nullable()
    .transform((val) => val || null),
  targetDate: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() ? new Date(val) : null)),
});

export type ObjectiveCreateInput = z.infer<typeof objectiveCreateSchema>;

export const objectiveUpdateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title must not exceed 120 characters")
    .optional(),
  description: z
    .string()
    .trim()
    .max(1000, "Description must not exceed 1000 characters")
    .optional()
    .nullable()
    .transform((val) => (val === undefined ? undefined : val || null)),
  status: objectiveStatusSchema.optional(),
  targetDate: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === undefined ? undefined : val && val.trim() ? new Date(val) : null)),
});

export type ObjectiveUpdateInput = z.infer<typeof objectiveUpdateSchema>;

export const objectiveProgressSchema = z.object({
  note: z
    .string()
    .trim()
    .min(3, "Progress note must be at least 3 characters")
    .max(1000, "Progress note must not exceed 1000 characters"),
  status: objectiveStatusSchema.optional(),
});

export type ObjectiveProgressInput = z.infer<typeof objectiveProgressSchema>;
