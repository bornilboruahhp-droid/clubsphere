import { prisma } from "@/lib/prisma";
import type { ClubRole, MembershipStatus, PlatformRole } from "@prisma/client";

export interface ClubMemberItem {
  id: string;
  userId: string;
  role: ClubRole;
  status: MembershipStatus;
  joinedAt: Date | null;
  user: {
    id: string;
    name: string;
    email?: string | null;
    studentId?: string | null;
    department?: string | null;
  };
}

export interface ClubPendingRequestItem {
  id: string;
  userId: string;
  role: ClubRole;
  status: MembershipStatus;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    studentId: string | null;
    department: string | null;
  };
}

/**
 * Fetches the active member roster for a club with appropriate field masking.
 */
export async function getClubRoster(
  clubId: string,
  userId: string,
  userRole: PlatformRole
): Promise<ClubMemberItem[]> {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { id: true, advisorId: true },
  });

  if (!club) {
    return [];
  }

  const isAdmin = userRole === "ADMIN";
  const isAdvisor = club.advisorId === userId;

  const callerMembership = await prisma.membership.findFirst({
    where: {
      clubId,
      userId,
      status: "ACTIVE",
    },
    select: { role: true },
  });

  const isPresident = callerMembership?.role === "PRESIDENT";
  const isSecretary = callerMembership?.role === "SECRETARY";
  const isTreasurer = callerMembership?.role === "TREASURER";
  const isMember = !!callerMembership;
  const isManager = isPresident || isSecretary;
  const isOfficer = isPresident || isSecretary || isTreasurer;

  // Non-members, non-advisor, non-admin cannot view roster
  if (!isAdmin && !isAdvisor && !isMember) {
    return [];
  }

  const canSeeFullDetails = isManager || isOfficer || isAdvisor || isAdmin;

  const members = await prisma.membership.findMany({
    where: {
      clubId,
      status: "ACTIVE",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          ...(canSeeFullDetails
            ? { email: true, studentId: true, department: true }
            : {}),
        },
      },
    },
    orderBy: [
      { role: "asc" },
      { joinedAt: "asc" },
    ],
  });

  return members.map((m) => ({
    id: m.id,
    userId: m.userId,
    role: m.role,
    status: m.status,
    joinedAt: m.joinedAt,
    user: {
      id: m.user.id,
      name: m.user.name,
      email: "email" in m.user ? (m.user.email as string) : undefined,
      studentId: "studentId" in m.user ? (m.user.studentId as string | null) : undefined,
      department: "department" in m.user ? (m.user.department as string | null) : undefined,
    },
  }));
}

/**
 * Fetches pending membership requests for club managers and platform administrators.
 */
export async function getClubPendingRequests(
  clubId: string,
  userId: string,
  userRole: PlatformRole
): Promise<ClubPendingRequestItem[]> {
  const isAdmin = userRole === "ADMIN";

  const callerMembership = await prisma.membership.findFirst({
    where: {
      clubId,
      userId,
      status: "ACTIVE",
      role: { in: ["PRESIDENT", "SECRETARY"] },
    },
    select: { role: true },
  });

  const isManager = !!callerMembership;

  if (!isAdmin && !isManager) {
    return [];
  }

  const requests = await prisma.membership.findMany({
    where: {
      clubId,
      status: "PENDING",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          studentId: true,
          department: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return requests.map((r) => ({
    id: r.id,
    userId: r.userId,
    role: r.role,
    status: r.status,
    createdAt: r.createdAt,
    user: r.user,
  }));
}
