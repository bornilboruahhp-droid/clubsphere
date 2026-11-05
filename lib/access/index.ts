import type { User, ClubRole, MembershipStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { forbidden, notFound } from "@/lib/api/errors";
import { isProfileComplete } from "@/lib/auth/get-current-user";

export interface MembershipRecord {
  role: ClubRole | "ADMIN";
  status: MembershipStatus;
}

/**
 * Validates that the user has the platform role of ADMIN.
 * Throws 403 FORBIDDEN if not.
 */
export function requireAdmin(user: User): User {
  if (user.role !== "ADMIN") {
    throw forbidden("Administrator privileges required");
  }
  return user;
}

/**
 * Validates that the user has completed student onboarding (studentId & department set).
 * Throws 403 FORBIDDEN if incomplete.
 */
export function requireProfileComplete(user: User): User {
  if (!isProfileComplete(user)) {
    throw forbidden("Profile onboarding must be completed before performing this action");
  }
  return user;
}

/**
 * Returns the ACTIVE club membership for a given user, or null if none exists.
 */
export async function getClubMembership(
  userId: string,
  clubId: string
): Promise<{ role: ClubRole; status: MembershipStatus } | null> {
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      clubId,
      status: "ACTIVE",
    },
    select: {
      role: true,
      status: true,
    },
  });

  return membership;
}

/**
 * Ensures the user is an ACTIVE President or Secretary of the club, or a platform ADMIN.
 * Throws NOT_FOUND if club does not exist or user lacks manager role.
 */
export async function requireClubManager(
  user: User,
  clubId: string
): Promise<MembershipRecord> {
  // Platform ADMIN has override access
  if (user.role === "ADMIN") {
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true },
    });
    if (!club) {
      throw notFound("Club not found");
    }
    return { role: "ADMIN", status: "ACTIVE" };
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: user.id,
      clubId,
      status: "ACTIVE",
      role: { in: ["PRESIDENT", "SECRETARY"] },
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

/**
 * Ensures the user is the ACTIVE President of the club, or a platform ADMIN.
 * Throws FORBIDDEN (403) if the user is a club member but lacks PRESIDENT role.
 * Throws NOT_FOUND (404) if club does not exist or user is not a member.
 */
export async function requireClubPresident(
  user: User,
  clubId: string
): Promise<MembershipRecord> {
  // Platform ADMIN has override access
  if (user.role === "ADMIN") {
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true },
    });
    if (!club) {
      throw notFound("Club not found");
    }
    return { role: "ADMIN", status: "ACTIVE" };
  }

  // Check that club exists
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { id: true },
  });
  if (!club) {
    throw notFound("Club not found");
  }

  // Check active membership
  const membership = await prisma.membership.findFirst({
    where: {
      userId: user.id,
      clubId,
      status: "ACTIVE",
    },
    select: {
      role: true,
      status: true,
    },
  });

  if (!membership) {
    throw notFound("Club not found");
  }

  if (membership.role !== "PRESIDENT") {
    throw forbidden("Only the club president or an administrator can perform this action");
  }

  return membership;
}

/**
 * Ensures the user is an ACTIVE Officer (President, Secretary, or Treasurer) of the club, or a platform ADMIN.
 * Throws NOT_FOUND if club does not exist or user lacks officer role.
 */
export async function requireClubOfficer(
  user: User,
  clubId: string
): Promise<MembershipRecord> {
  // Platform ADMIN has override access
  if (user.role === "ADMIN") {
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true },
    });
    if (!club) {
      throw notFound("Club not found");
    }
    return { role: "ADMIN", status: "ACTIVE" };
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

/**
 * Ensures the user is the assigned faculty advisor for the specified club, or a platform ADMIN.
 * Throws NOT_FOUND if club does not exist or user is not the advisor.
 */
export async function requireClubAdvisor(
  user: User,
  clubId: string
): Promise<{ clubId: string; advisorId: string }> {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { id: true, advisorId: true },
  });

  if (!club) {
    throw notFound("Club not found");
  }

  if (user.role !== "ADMIN" && club.advisorId !== user.id) {
    throw notFound("Club not found");
  }

  return { clubId: club.id, advisorId: club.advisorId };
}
