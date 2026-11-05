import type { EventStatus } from "@prisma/client";

export const EVENT_TRANSITIONS: Record<EventStatus, readonly EventStatus[]> = {
  DRAFT: ["PUBLISHED", "CANCELLED"],
  PUBLISHED: ["CANCELLED", "COMPLETED"],
  CANCELLED: [],
  COMPLETED: [],
} as const;

export function canTransitionEvent(
  from: EventStatus,
  to: EventStatus
): boolean {
  return EVENT_TRANSITIONS[from].includes(to);
}
