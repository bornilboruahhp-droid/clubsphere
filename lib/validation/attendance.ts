import { z } from "zod";

export const attendanceSingleSchema = z.object({
  status: z.enum(["PRESENT", "ABSENT"]),
});

export const attendanceBulkSchema = z.object({
  registrationIds: z
    .array(z.string().min(1, "Registration ID cannot be empty"))
    .min(1, "At least one registration ID must be provided")
    .max(200, "Cannot process more than 200 registrations in a single batch"),
  status: z.enum(["PRESENT", "ABSENT"]),
});

export type AttendanceSingleInput = z.infer<typeof attendanceSingleSchema>;
export type AttendanceBulkInput = z.infer<typeof attendanceBulkSchema>;
