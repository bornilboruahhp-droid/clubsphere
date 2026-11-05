export const AUDIT_ACTIONS = {
  USER: {
    PROFILE_UPDATED: "user.profile_updated",
    ROLE_CHANGED: "user.role_changed",
  },
  CLUB: {
    SUBMITTED: "club.submitted",
    PROFILE_UPDATED: "club.profile_updated",
    ACTIVATED: "club.activated",
    REJECTED: "club.rejected",
    CREATED: "club.created",
    UPDATED: "club.updated",
    STATUS_CHANGED: "club.status_changed",
    SUSPENDED: "club.suspended",
    REACTIVATED: "club.reactivated",
    ADVISOR_CHANGED: "club.advisor_changed",
  },
  APPROVAL: {
    SUBMITTED: "approval.submitted",
    DECIDED: "approval.decided",
  },
  MEMBERSHIP: {
    REQUESTED: "membership.requested",
    APPROVED: "membership.approved",
    REJECTED: "membership.rejected",
    ROLE_CHANGED: "membership.role_changed",
    REMOVED: "membership.removed",
    LEFT: "membership.left",
  },
  OBJECTIVE: {
    CREATED: "objective.created",
    UPDATED: "objective.updated",
    DELETED: "objective.deleted",
    PROGRESS_ADDED: "objective.progress_added",
  },
  EVENT: {
    CREATED: "event.created",
    UPDATED: "event.updated",
    PUBLISHED: "event.published",
    CANCELLED: "event.cancelled",
    COMPLETED: "event.completed",
    REGISTERED: "event.registered",
    REGISTRATION_CANCELLED: "event.registration_cancelled",
  },
  ATTENDANCE: {
    MARKED: "attendance.marked",
    FINALIZED: "attendance.finalized",
    CHECKED_IN: "attendance.checked_in",
  },
  ANNOUNCEMENT: {
    CREATED: "announcement.created",
    DELETED: "announcement.deleted",
  },
  REPORT: {
    EXPORTED: "report.exported",
  },
} as const;

export type AuditAction =
  | (typeof AUDIT_ACTIONS.USER)[keyof typeof AUDIT_ACTIONS.USER]
  | (typeof AUDIT_ACTIONS.CLUB)[keyof typeof AUDIT_ACTIONS.CLUB]
  | (typeof AUDIT_ACTIONS.APPROVAL)[keyof typeof AUDIT_ACTIONS.APPROVAL]
  | (typeof AUDIT_ACTIONS.MEMBERSHIP)[keyof typeof AUDIT_ACTIONS.MEMBERSHIP]
  | (typeof AUDIT_ACTIONS.OBJECTIVE)[keyof typeof AUDIT_ACTIONS.OBJECTIVE]
  | (typeof AUDIT_ACTIONS.EVENT)[keyof typeof AUDIT_ACTIONS.EVENT]
  | (typeof AUDIT_ACTIONS.ATTENDANCE)[keyof typeof AUDIT_ACTIONS.ATTENDANCE]
  | (typeof AUDIT_ACTIONS.ANNOUNCEMENT)[keyof typeof AUDIT_ACTIONS.ANNOUNCEMENT]
  | (typeof AUDIT_ACTIONS.REPORT)[keyof typeof AUDIT_ACTIONS.REPORT];
