import type { AttendanceStatus } from "@prisma/client";

export const ATTENDANCE_TRANSITIONS: Record<
  AttendanceStatus,
  readonly AttendanceStatus[]
> = {
  REGISTERED: ["PRESENT", "ABSENT", "CANCELLED"],
  PRESENT: ["ABSENT"],
  ABSENT: ["PRESENT"],
  CANCELLED: ["REGISTERED"],
} as const;

export function canTransitionAttendance(
  from: AttendanceStatus,
  to: AttendanceStatus
): boolean {
  return ATTENDANCE_TRANSITIONS[from].includes(to);
}
