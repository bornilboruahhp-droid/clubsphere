import type { ClubStatus } from "@prisma/client";

/**
 * Valid state transitions for a Club.
 * PENDING → ACTIVE, REJECTED
 * ACTIVE → SUSPENDED
 * SUSPENDED → ACTIVE
 * REJECTED is terminal (no further transitions permitted).
 */
export const CLUB_TRANSITIONS: Record<ClubStatus, readonly ClubStatus[]> = {
  PENDING: ["ACTIVE", "REJECTED"],
  ACTIVE: ["SUSPENDED"],
  SUSPENDED: ["ACTIVE"],
  REJECTED: [],
} as const;

/**
 * Checks whether transitioning a club from one status to another is valid.
 */
export function canTransition(from: ClubStatus, to: ClubStatus): boolean {
  return CLUB_TRANSITIONS[from]?.includes(to) ?? false;
}
