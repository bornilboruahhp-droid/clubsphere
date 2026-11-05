import { z } from "zod";

export const clubRegistrationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Club name must be at least 3 characters")
    .max(80, "Club name must not exceed 80 characters"),
  description: z
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description must not exceed 2000 characters"),
  advisorId: z
    .string()
    .min(1, "Faculty advisor must be selected"),
  objectives: z
    .array(
      z
        .string()
        .trim()
        .min(3, "Objective must be at least 3 characters")
        .max(120, "Objective must not exceed 120 characters")
    )
    .min(1, "At least 1 club objective is required")
    .max(5, "A maximum of 5 initial objectives can be submitted"),
});

export type ClubRegistrationInput = z.infer<typeof clubRegistrationSchema>;

export const clubListQuerySchema = z.object({
  q: z.string().trim().optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ClubListQueryInput = z.infer<typeof clubListQuerySchema>;

export const clubReviewSchema = z
  .object({
    decision: z.enum(["APPROVED", "REJECTED"]),
    comment: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      if (data.decision === "REJECTED") {
        return !!data.comment && data.comment.length >= 5;
      }
      return true;
    },
    {
      message: "A comment of at least 5 characters is required for rejection",
      path: ["comment"],
    }
  );

export type ClubReviewInput = z.infer<typeof clubReviewSchema>;

export const clubProfileUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Club name must be at least 3 characters")
    .max(80, "Club name must not exceed 80 characters"),
  description: z
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description must not exceed 2000 characters"),
});

export type ClubProfileUpdateInput = z.infer<typeof clubProfileUpdateSchema>;
