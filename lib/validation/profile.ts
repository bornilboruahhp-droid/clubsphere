import { z } from "zod";

export const profileSchema = z.object({
  studentId: z
    .string()
    .trim()
    .min(3, "Student ID must be at least 3 characters")
    .max(32, "Student ID cannot exceed 32 characters"),
  department: z
    .string()
    .trim()
    .min(2, "Department must be at least 2 characters")
    .max(80, "Department cannot exceed 80 characters"),
});

export type ProfileInput = z.infer<typeof profileSchema>;
