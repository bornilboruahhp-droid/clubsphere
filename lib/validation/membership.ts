import { z } from "zod";

export const membershipQuerySchema = z.object({
  status: z.enum(["ACTIVE", "PENDING"]).default("ACTIVE"),
});

export type MembershipQueryInput = z.infer<typeof membershipQuerySchema>;

export const membershipActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("approve"),
  }),
  z.object({
    action: z.literal("reject"),
  }),
  z.object({
    action: z.literal("remove"),
  }),
  z.object({
    action: z.literal("set_role"),
    role: z.enum(["TREASURER", "SECRETARY", "MEMBER"]),
  }),
]);

export type MembershipActionInput = z.infer<typeof membershipActionSchema>;
