import { prisma } from "@/lib/prisma";
import { User, MembershipStatus, EventStatus, AttendanceStatus } from "@prisma/client";
import { notFound } from "@/lib/api/errors";

export type ClubAnalyticsRange = "90d" | "12m" | "all";

export interface ParsedClubRange {
  range: ClubAnalyticsRange;
  startDate: Date | null;
  endDate: Date;
  label: string;
}

export interface ClubStatCards {
  activeMembers: number;
  newMembersInRange: number;
  eventsHeld: number;
  averageAttendanceRate: number | null; // (present / (present + absent)) * 100
  conversionRate: number | null;        // (present / total registered) * 100
  presentCount: number;
  absentCount: number;
  totalRegistrations: number;
}

export interface ClubMemberTrendItem {
  key: string;   // "YYYY-MM"
  label: string; // "Oct 2026"
  count: number;
}

export interface ClubEventAttendanceItem {
  id: string;
  title: string;
  date: Date;
  registeredCount: number;
  presentCount: number;
  absentCount: number;
  attendanceRate: number | null;
  conversionRate: number | null;
}

export interface ParticipationDistribution {
  zeroEvents: number;
  oneToTwoEvents: number;
  threePlusEvents: number;
  totalActiveMembers: number;
}

export interface ClubAnalyticsData {
  range: ParsedClubRange;
  statCards: ClubStatCards;
  membersOverTime: ClubMemberTrendItem[];
  eventAttendance: ClubEventAttendanceItem[];
  participation: ParticipationDistribution;
}

/**
 * Access guard: Validates that the user is an active officer (President, Secretary, Treasurer),
 * the club's faculty advisor, or a platform administrator.
 * Throws notFound() on unauthorized access.
 */
export async function requireClubAnalyticsAccess(
  user: User,
  clubId: string
): Promise<{ role: string; status: string }> {
  if (user.role === "ADMIN") {
    return { role: "ADMIN", status: "ACTIVE" };
  }

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { id: true, advisorId: true },
  });

  if (!club) {
    throw notFound("Club not found");
  }

  if (club.advisorId === user.id) {
    return { role: "ADVISOR", status: "ACTIVE" };
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: user.id,
      clubId,
      status: "ACTIVE",
      role: { in: ["PRESIDENT", "SECRETARY", "TREASURER"] },
    },
    select: {
      role: true,
      status: true,
    },
  });

  if (!membership) {
    throw notFound("Club not found");
  }

  return membership;
}

export function parseClubRange(
  rangeParam?: string | null,
  clubCreatedAt?: Date
): ParsedClubRange {
  const now = new Date();
  let range: ClubAnalyticsRange = "90d";

  if (rangeParam === "12m" || rangeParam === "all") {
    range = rangeParam;
  }

  let startDate: Date | null = null;
  let label = "Last 90 days";

  if (range === "90d") {
    startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    label = "Last 90 days";
  } else if (range === "12m") {
    startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    label = "Last 12 months";
  } else if (range === "all") {
    startDate = clubCreatedAt ?? new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    label = "All Time";
  }

  return { range, startDate, endDate: now, label };
}

function generateMonthBuckets(startDate: Date, endDate: Date): ClubMemberTrendItem[] {
  const buckets: ClubMemberTrendItem[] = [];
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

export async function getClubStatCards(
  clubId: string,
  rangeInfo: ParsedClubRange
): Promise<ClubStatCards> {
  const { startDate, endDate } = rangeInfo;

  // 1. Total active members today
  const activeMembersPromise = prisma.membership.count({
    where: {
      clubId,
      status: "ACTIVE",
    },
  });

  // 2. New active members in range
  const newMembersPromise = prisma.membership.count({
    where: {
      clubId,
      status: "ACTIVE",
      ...(startDate ? { createdAt: { gte: startDate, lte: endDate } } : {}),
    },
  });

  // 3. Completed events held in range
  const eventsHeldPromise = prisma.event.count({
    where: {
      clubId,
      status: EventStatus.COMPLETED,
      ...(startDate ? { startsAt: { gte: startDate, lte: endDate } } : {}),
    },
  });

  // 4. Attendance counts across completed events in range
  const attendanceCountsPromise = prisma.eventRegistration.groupBy({
    by: ["status"],
    where: {
      event: {
        clubId,
        status: EventStatus.COMPLETED,
        ...(startDate ? { startsAt: { gte: startDate, lte: endDate } } : {}),
      },
      status: {
        in: [
          AttendanceStatus.PRESENT,
          AttendanceStatus.ABSENT,
          AttendanceStatus.REGISTERED,
        ],
      },
    },
    _count: { id: true },
  });

  const [activeMembers, newMembersInRange, eventsHeld, attendanceCounts] =
    await Promise.all([
      activeMembersPromise,
      newMembersPromise,
      eventsHeldPromise,
      attendanceCountsPromise,
    ]);

  const presentCount =
    attendanceCounts.find((c) => c.status === AttendanceStatus.PRESENT)?._count.id ?? 0;
  const absentCount =
    attendanceCounts.find((c) => c.status === AttendanceStatus.ABSENT)?._count.id ?? 0;
  const registeredOnly =
    attendanceCounts.find((c) => c.status === AttendanceStatus.REGISTERED)?._count.id ?? 0;

  const totalDecided = presentCount + absentCount;
  const totalRegistrations = totalDecided + registeredOnly;

  const averageAttendanceRate =
    totalDecided > 0 ? (presentCount / totalDecided) * 100 : null;
  const conversionRate =
    totalRegistrations > 0 ? (presentCount / totalRegistrations) * 100 : null;

  return {
    activeMembers,
    newMembersInRange,
    eventsHeld,
    averageAttendanceRate,
    conversionRate,
    presentCount,
    absentCount,
    totalRegistrations,
  };
}

export async function getClubMembersOverTime(
  clubId: string,
  rangeInfo: ParsedClubRange
): Promise<ClubMemberTrendItem[]> {
  const { startDate, endDate } = rangeInfo;
  const bucketStart = startDate ?? new Date(endDate.getFullYear() - 1, endDate.getMonth(), 1);
  const buckets = generateMonthBuckets(bucketStart, endDate);

  const rawResults = startDate
    ? await prisma.$queryRaw<Array<{ month: string; count: bigint | number }>>`
        SELECT TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month,
               COUNT(*)::bigint AS count
        FROM "Membership"
        WHERE "clubId" = ${clubId}
          AND "status" = 'ACTIVE'
          AND "createdAt" >= ${startDate}
          AND "createdAt" <= ${endDate}
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY DATE_TRUNC('month', "createdAt") ASC
      `
    : await prisma.$queryRaw<Array<{ month: string; count: bigint | number }>>`
        SELECT TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month,
               COUNT(*)::bigint AS count
        FROM "Membership"
        WHERE "clubId" = ${clubId}
          AND "status" = 'ACTIVE'
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

export async function getClubEventAttendanceStats(
  clubId: string,
  rangeInfo: ParsedClubRange
): Promise<ClubEventAttendanceItem[]> {
  const { startDate, endDate } = rangeInfo;

  const events = await prisma.event.findMany({
    where: {
      clubId,
      status: EventStatus.COMPLETED,
      ...(startDate ? { startsAt: { gte: startDate, lte: endDate } } : {}),
    },
    select: {
      id: true,
      title: true,
      startsAt: true,
      registrations: {
        where: {
          status: {
            in: [
              AttendanceStatus.PRESENT,
              AttendanceStatus.ABSENT,
              AttendanceStatus.REGISTERED,
            ],
          },
        },
        select: {
          status: true,
        },
      },
    },
    orderBy: { startsAt: "asc" },
  });

  return events.map((event) => {
    let presentCount = 0;
    let absentCount = 0;
    let registeredCount = 0;

    for (const reg of event.registrations) {
      registeredCount++;
      if (reg.status === AttendanceStatus.PRESENT) presentCount++;
      else if (reg.status === AttendanceStatus.ABSENT) absentCount++;
    }

    const decided = presentCount + absentCount;
    const attendanceRate = decided > 0 ? (presentCount / decided) * 100 : null;
    const conversionRate = registeredCount > 0 ? (presentCount / registeredCount) * 100 : null;

    return {
      id: event.id,
      title: event.title,
      date: event.startsAt,
      registeredCount,
      presentCount,
      absentCount,
      attendanceRate,
      conversionRate,
    };
  });
}

export async function getClubParticipationDistribution(
  clubId: string,
  rangeInfo: ParsedClubRange
): Promise<ParticipationDistribution> {
  const { startDate, endDate } = rangeInfo;

  // 1. Get all active members for this club
  const activeMembers = await prisma.membership.findMany({
    where: {
      clubId,
      status: "ACTIVE",
    },
    select: {
      userId: true,
    },
  });

  const totalActiveMembers = activeMembers.length;
  if (totalActiveMembers === 0) {
    return {
      zeroEvents: 0,
      oneToTwoEvents: 0,
      threePlusEvents: 0,
      totalActiveMembers: 0,
    };
  }

  const memberIds = activeMembers.map((m) => m.userId);

  // 2. Aggregate count of COMPLETED events attended per active member in range
  const attendances = await prisma.eventRegistration.groupBy({
    by: ["userId"],
    where: {
      event: {
        clubId,
        status: EventStatus.COMPLETED,
        ...(startDate ? { startsAt: { gte: startDate, lte: endDate } } : {}),
      },
      status: AttendanceStatus.PRESENT,
      userId: { in: memberIds },
    },
    _count: { id: true },
  });

  let oneToTwoEvents = 0;
  let threePlusEvents = 0;

  attendances.forEach((record) => {
    const count = record._count.id;
    if (count >= 3) {
      threePlusEvents++;
    } else if (count >= 1) {
      oneToTwoEvents++;
    }
  });

  const zeroEvents = Math.max(0, totalActiveMembers - attendances.length);

  return {
    zeroEvents,
    oneToTwoEvents,
    threePlusEvents,
    totalActiveMembers,
  };
}

export async function getClubAnalytics(
  clubId: string,
  rangeParam?: string | null,
  clubCreatedAt?: Date
): Promise<ClubAnalyticsData> {
  const rangeInfo = parseClubRange(rangeParam, clubCreatedAt);

  const [statCards, membersOverTime, eventAttendance, participation] =
    await Promise.all([
      getClubStatCards(clubId, rangeInfo),
      getClubMembersOverTime(clubId, rangeInfo),
      getClubEventAttendanceStats(clubId, rangeInfo),
      getClubParticipationDistribution(clubId, rangeInfo),
    ]);

  return {
    range: rangeInfo,
    statCards,
    membersOverTime,
    eventAttendance,
    participation,
  };
}
