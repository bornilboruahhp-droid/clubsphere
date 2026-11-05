export interface DescribeInput {
  action: string;
  actorName?: string | null;
  metadata?: any;
  entityType?: string;
  entityId?: string;
}

/**
 * Maps an audit action and its metadata to a clear, human-readable sentence.
 */
export function describeAuditEntry(entry: DescribeInput): string {
  const actor = entry.actorName || "System";
  const meta = (typeof entry.metadata === "object" && entry.metadata !== null)
    ? entry.metadata
    : {};

  switch (entry.action) {
    // Club Actions
    case "club.submitted":
      return `${actor} submitted the club charter application.`;
    case "club.profile_updated":
      return `${actor} updated the organization profile settings.`;
    case "club.activated":
      return `${actor} activated the organization charter.`;
    case "club.rejected":
      return `${actor} rejected the organization charter.`;
    case "club.created":
      return `${actor} created the organization record.`;
    case "club.updated":
      return `${actor} updated organization details.`;
    case "club.status_changed":
      return `${actor} changed organization status to ${meta.status || "new status"}.`;
    case "club.suspended":
      return `${actor} suspended the organization${meta.reason ? `: "${meta.reason}"` : ""}.`;
    case "club.reactivated":
      return `${actor} reinstated the organization to active status.`;
    case "club.advisor_changed":
      return `${actor} reassigned faculty sponsor to ${meta.newAdvisorName || "a new advisor"}.`;

    // Approval Actions
    case "approval.submitted":
      return `${actor} submitted the charter for ${meta.stage || "faculty/administrative"} review.`;
    case "approval.decided": {
      const decision = meta.decision === "APPROVED" ? "approved" : "rejected";
      const stage = meta.stage ? ` (${meta.stage} stage)` : "";
      return `${actor} ${decision} the organization charter${stage}.`;
    }

    // Membership Actions
    case "membership.requested":
      return `${actor} submitted a request to join the organization.`;
    case "membership.approved":
      return `${actor} approved a membership request.`;
    case "membership.rejected":
      return `${actor} rejected a membership request.`;
    case "membership.role_changed":
      return `${actor} updated member role to ${meta.newRole || meta.role || "new role"}.`;
    case "membership.removed":
      return `${actor} removed a member from the organization roster.`;
    case "membership.left":
      return `${actor} resigned from the organization.`;

    // Goal / Objective Actions
    case "objective.created":
      return `${actor} created goal: "${meta.title || "New Goal"}".`;
    case "objective.updated":
      return `${actor} updated goal: "${meta.title || "Goal"}".`;
    case "objective.deleted":
      return `${actor} deleted an organization goal.`;
    case "objective.progress_added":
      return `${actor} posted a goal progress update.`;

    // Event Actions
    case "event.created":
      return `${actor} drafted a new event: "${meta.title || "New Event"}".`;
    case "event.updated":
      return `${actor} updated event details: "${meta.title || "Event"}".`;
    case "event.published":
      return `${actor} published event: "${meta.title || "Event"}".`;
    case "event.cancelled":
      return `${actor} cancelled event: "${meta.title || "Event"}".`;
    case "event.completed":
      return `${actor} marked event as completed.`;
    case "event.registered":
      return `${actor} registered for an event.`;
    case "event.registration_cancelled":
      return `${actor} cancelled their event registration.`;

    // Attendance Actions
    case "attendance.marked":
      return `${actor} updated attendee attendance records.`;
    case "attendance.finalized":
      return `${actor} finalized the event attendance roster.`;
    case "attendance.checked_in":
      return `${actor} confirmed attendance via QR check-in.`;

    // Announcement Actions
    case "announcement.created":
      return `${actor} posted announcement: "${meta.title || "Announcement"}".`;
    case "announcement.deleted":
      return `${actor} deleted an announcement.`;

    // Report Actions
    case "report.exported":
      return `${actor} exported ${meta.reportName || "data"} report (${meta.rowCount ?? 0} rows).`;

    // User & Platform Actions
    case "user.profile_updated":
      return `${actor} updated their profile information.`;
    case "user.role_changed":
      return `${actor} updated user platform role to ${meta.newRole || "new role"}.`;

    // Elections (MVP Note / Reserved)
    case "election.vote_cast":
      return `${actor} cast an anonymized secret ballot.`;

    default:
      return `${actor} performed ${entry.action.replace(/[._]/g, " ")}.`;
  }
}
