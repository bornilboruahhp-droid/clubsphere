import { z } from "zod";

export const registrationsQuerySchema = z.object({
  status: z.enum(["REGISTERED", "PRESENT", "ABSENT", "CANCELLED"]).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const myEventsQuerySchema = z.object({
  when: z.enum(["upcoming", "past"]).default("upcoming"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type RegistrationsQuery = z.infer<typeof registrationsQuerySchema>;
export type MyEventsQuery = z.infer<typeof myEventsQuerySchema>;
