import { prisma } from "@/lib/prisma";
import { ClubStatus, ApprovalDecision, AttendanceStatus, EventStatus } from "@prisma/client";

export type AnalyticsRange = "30d" | "90d" | "12m";

export interface ParsedRange {
  range: AnalyticsRange;
  startDate: Date;
  endDate: Date;
  label: string;
}

export interface AdminStatCards {
  activeClubs: number;
  pendingApprovals: number;
  activeMembers: number;
  eventsHeld: number;
  attendanceRate: number | null; // e.g. 78.5 for 78.5%, null if no attendances recorded
  presentCount: number;
  absentCount: number;
}

export interface ClubsByStatusItem {
  status: ClubStatus;
  label: string;
  count: number;
  fill: string;
}

export interface MonthlyTrendItem {
  key: string;   // "YYYY-MM"
  label: string; // "Oct 2026"
  count: number;
}

export interface OverdueApprovalItem {
  id: string;
  clubId: string;
  clubName: string;
  stage: string;
  submittedAt: Date;
  daysPending: number;
  reviewerName?: string | null;
}

export interface InactiveClubItem {
  id: string;
  name: string;
  activeMemberCount: number;
  createdAt: Date;
  lastEventDate?: Date | null;
}

export interface AdminExceptionsData {
  overdueApprovals: OverdueApprovalItem[];
  inactiveClubs: InactiveClubItem[];
}

export function parseRange(rangeParam?: string | null): ParsedRange {
  const now = new Date();
  let range: AnalyticsRange = "30d";

  if (rangeParam === "90d" || rangeParam === "12m") {
    range = rangeParam;
  }

  let startDate: Date;
  let label: string;

  if (range === "90d") {
    startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    label = "Last 90 days";
  } else if (range === "12m") {
    startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    label = "Last 12 months";
  } else {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    label = "Last 30 days";
  }

  return { range, startDate, endDate: now, label };
}

function generateMonthBuckets(startDate: Date, endDate: Date): MonthlyTrendItem[] {
  const buckets: MonthlyTrendItem[] = [];
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (current <= end) {
    const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
    const label = current.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    buckets.push({ key, label, count: 0 });
    current.setMonth(current.getMonth() + 1);
  }

  return buckets;
}

export async function getAdminStatCards(range: AnalyticsRange): Promise<AdminStatCards> {
  const { startDate, endDate } = parseRange(range);

  // 1. Active clubs
  const activeClubsPromise = prisma.club.count({
    where: { status: ClubStatus.ACTIVE },
  });

  // 2. Pending approvals
  const pendingApprovalsPromise = prisma.clubApproval.count({
    where: { decision: ApprovalDecision.PENDING },
  });

  // 3. Active members (distinct users holding ACTIVE membership)
  const activeMembersPromise = prisma.membership.findMany({
    where: { status: "ACTIVE" },
    distinct: ["userId"],
    select: { userId: true },
  });

  // 4. Events held in range (COMPLETED events with startsAt in range)
  const eventsHeldPromise = prisma.event.count({
    where: {
      status: EventStatus.COMPLETED,
      startsAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // 5. Attendance counts in range
  const attendanceCountsPromise = prisma.eventRegistration.groupBy({
    by: ["status"],
    where: {
      event: {
        startsAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      status: { in: [AttendanceStatus.PRESENT, AttendanceStatus.ABSENT] },
    },
    _count: { id: true },
  });

  const [activeClubs, pendingApprovals, activeMembersList, eventsHeld, attendanceCounts] =
    await Promise.all([
      activeClubsPromise,
      pendingApprovalsPromise,
      activeMembersPromise,
      eventsHeldPromise,
      attendanceCountsPromise,
    ]);

  const presentCount =
    attendanceCounts.find((c) => c.status === AttendanceStatus.PRESENT)?._count.id ?? 0;
  const absentCount =
    attendanceCounts.find((c) => c.status === AttendanceStatus.ABSENT)?._count.id ?? 0;
  const totalDecided = presentCount + absentCount;
  const attendanceRate = totalDecided > 0 ? (presentCount / totalDecided) * 100 : null;

  return {
    activeClubs,
    pendingApprovals,
    activeMembers: activeMembersList.length,
    eventsHeld,
    attendanceRate,
    presentCount,
    absentCount,
  };
}

export async function getClubsByStatus(): Promise<ClubsByStatusItem[]> {
  const grouped = await prisma.club.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  const countMap = new Map<ClubStatus, number>();
  grouped.forEach((g) => countMap.set(g.status, g._count.id));

  // Consistent status mapping and theme token colors
  return [
    {
      status: ClubStatus.ACTIVE,
      label: "Active",
      count: countMap.get(ClubStatus.ACTIVE) ?? 0,
      fill: "var(--state-success)",
    },
    {
      status: ClubStatus.PENDING,
      label: "Pending Review",
      count: countMap.get(ClubStatus.PENDING) ?? 0,
      fill: "var(--state-warning)",
    },
    {
      status: ClubStatus.SUSPENDED,
      label: "Suspended",
      count: countMap.get(ClubStatus.SUSPENDED) ?? 0,
      fill: "var(--state-error)",
    },
    {
      status: ClubStatus.REJECTED,
      label: "Rejected",
      count: countMap.get(ClubStatus.REJECTED) ?? 0,
      fill: "var(--copy-muted)",
    },
  ];
}

export async function getNewMembershipsPerMonth(
  range: AnalyticsRange
): Promise<MonthlyTrendItem[]> {
  const { startDate } = parseRange(range);
  const buckets = generateMonthBuckets(startDate, new Date());

  const rawResults = await prisma.$queryRaw<Array<{ month: string; count: bigint | number }>>`
    SELECT TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month,
           COUNT(*)::bigint AS count
    FROM "Membership"
    WHERE "createdAt" >= ${startDate} AND "status" = 'ACTIVE'
    GROUP BY DATE_TRUNC('month', "createdAt")
    ORDER BY DATE_TRUNC('month', "createdAt") ASC
  `;

  const countsByKey = new Map<string, number>();
  rawResults.forEach((r) => {
    countsByKey.set(r.month, Number(r.count));
  });

  return buckets.map((b) => ({
    ...b,
    count: countsByKey.get(b.key) ?? 0,
  }));
}

export async function getEventsHeldPerMonth(
  range: AnalyticsRange
): Promise<MonthlyTrendItem[]> {
  const { startDate } = parseRange(range);
  const buckets = generateMonthBuckets(startDate, new Date());

  const rawResults = await prisma.$queryRaw<Array<{ month: string; count: bigint | number }>>`
    SELECT TO_CHAR(DATE_TRUNC('month', "startsAt"), 'YYYY-MM') AS month,
           COUNT(*)::bigint AS count
    FROM "Event"
    WHERE "startsAt" >= ${startDate} AND "status" = 'COMPLETED'
    GROUP BY DATE_TRUNC('month', "startsAt")
    ORDER BY DATE_TRUNC('month', "startsAt") ASC
  `;

  const countsByKey = new Map<string, number>();
  rawResults.forEach((r) => {
    countsByKey.set(r.month, Number(r.count));
  });

  return buckets.map((b) => ({
    ...b,
    count: countsByKey.get(b.key) ?? 0,
  }));
}

export async function getAdminExceptions(): Promise<AdminExceptionsData> {
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000);

  // 1. Clubs whose pending review is older than 7 days
  const pendingApprovals = await prisma.clubApproval.findMany({
    where: {
      decision: ApprovalDecision.PENDING,
      createdAt: { lte: sevenDaysAgo },
    },
    include: {
      club: {
        select: { id: true, name: true },
      },
      reviewer: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const overdueApprovals: OverdueApprovalItem[] = pendingApprovals.map((approval) => {
    const daysPending = Math.floor(
      (now - new Date(approval.createdAt).getTime()) / (24 * 60 * 60 * 1000)
    );
    return {
      id: approval.id,
      clubId: approval.club.id,
      clubName: approval.club.name,
      stage: approval.stage,
      submittedAt: approval.createdAt,
      daysPending,
      reviewerName: approval.reviewer?.name,
    };
  });

  // 2. ACTIVE clubs with no PUBLISHED or COMPLETED event in the last 90 days
  const inactiveClubsRaw = await prisma.club.findMany({
    where: {
      status: ClubStatus.ACTIVE,
      events: {
        none: {
          status: { in: [EventStatus.PUBLISHED, EventStatus.COMPLETED] },
          startsAt: { gte: ninetyDaysAgo },
        },
      },
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      _count: {
        select: {
          memberships: { where: { status: "ACTIVE" } },
        },
      },
      events: {
        select: { startsAt: true },
        orderBy: { startsAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const inactiveClubs: InactiveClubItem[] = inactiveClubsRaw.map((club) => ({
    id: club.id,
    name: club.name,
    activeMemberCount: club._count.memberships,
    createdAt: club.createdAt,
    lastEventDate: club.events[0]?.startsAt ?? null,
  }));

  return {
    overdueApprovals,
    inactiveClubs,
  };
}
