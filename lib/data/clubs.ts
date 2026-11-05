import { prisma } from "@/lib/prisma";
import type { ClubStatus, ClubRole, MembershipStatus, ObjectiveStatus } from "@prisma/client";

export interface ActiveClubCardData {
  id: string;
  name: string;
  description: string;
  status: ClubStatus;
  createdAt: Date;
  advisor: {
    id: string;
    name: string;
    department: string | null;
  };
  activeMemberCount: number;
}

export interface MyClubCardData {
  id: string;
  name: string;
  description: string;
  status: ClubStatus;
  createdAt: Date;
  updatedAt: Date;
  isProposer: boolean;
  myRole: ClubRole | null;
  myStatus: MembershipStatus | null;
  advisor: {
    name: string;
    department: string | null;
  };
  activeMemberCount: number;
}

export interface ClubDetailsData {
  id: string;
  name: string;
  description: string;
  status: ClubStatus;
  proposerId: string;
  advisorId: string;
  createdAt: Date;
  updatedAt: Date;
  proposer: {
    id: string;
    name: string;
    email: string;
  };
  advisor: {
    id: string;
    name: string;
    department: string | null;
    email: string;
  };
  objectives: {
    id: string;
    title: string;
    description: string | null;
    status: ObjectiveStatus;
    targetDate: Date | null;
    createdAt: Date;
  }[];
  approvals: {
    id: string;
    stage: "ADVISOR" | "ADMIN";
    decision: "PENDING" | "APPROVED" | "REJECTED";
    comment: string | null;
    decidedAt: Date | null;
    createdAt: Date;
    reviewer?: {
      name: string;
    } | null;
  }[];
  officers: {
    role: ClubRole;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }[];
  viewerMembership: {
    role: ClubRole;
    status: MembershipStatus;
  } | null;
  activeMemberCount: number;
}

/**
 * Retrieves all ACTIVE clubs for the public campus directory with optional search.
 */
export async function getActiveClubs(query?: string): Promise<ActiveClubCardData[]> {
  const clubs = await prisma.club.findMany({
    where: {
      status: "ACTIVE",
      ...(query && query.trim()
        ? {
            name: {
              contains: query.trim(),
              mode: "insensitive",
            },
          }
        : {}),
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      createdAt: true,
      advisor: {
        select: {
          id: true,
          name: true,
          department: true,
        },
      },
      _count: {
        select: {
          memberships: {
            where: {
              status: "ACTIVE",
            },
          },
        },
      },
    },
  });

  return clubs.map((club) => ({
    id: club.id,
    name: club.name,
    description: club.description,
    status: club.status,
    createdAt: club.createdAt,
    advisor: club.advisor,
    activeMemberCount: club._count.memberships,
  }));
}

/**
 * Retrieves clubs where the user is an active member, has pending membership, or is the proposer.
 */
export async function getMyClubs(userId: string): Promise<MyClubCardData[]> {
  const clubs = await prisma.club.findMany({
    where: {
      OR: [
        { proposerId: userId },
        { memberships: { some: { userId } } },
      ],
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      proposerId: true,
      createdAt: true,
      updatedAt: true,
      advisor: {
        select: {
          name: true,
          department: true,
        },
      },
      memberships: {
        where: {
          userId,
        },
        select: {
          role: true,
          status: true,
        },
      },
      _count: {
        select: {
          memberships: {
            where: {
              status: "ACTIVE",
            },
          },
        },
      },
    },
  });

  return clubs.map((club) => {
    const mem = club.memberships[0] ?? null;
    return {
      id: club.id,
      name: club.name,
      description: club.description,
      status: club.status,
      createdAt: club.createdAt,
      updatedAt: club.updatedAt,
      isProposer: club.proposerId === userId,
      myRole: mem?.role ?? null,
      myStatus: mem?.status ?? null,
      advisor: club.advisor,
      activeMemberCount: club._count.memberships,
    };
  });
}

/**
 * Retrieves full club details for the club profile page shell.
 */
export async function getClubDetails(
  clubId: string,
  userId: string
): Promise<ClubDetailsData | null> {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    include: {
      proposer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      advisor: {
        select: {
          id: true,
          name: true,
          department: true,
          email: true,
        },
      },
      objectives: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          targetDate: true,
          createdAt: true,
        },
      },
      approvals: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          reviewer: {
            select: {
              name: true,
            },
          },
        },
      },
      memberships: {
        where: {
          OR: [
            { userId },
            {
              status: "ACTIVE",
              role: { in: ["PRESIDENT", "SECRETARY", "TREASURER"] },
            },
          ],
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          memberships: {
            where: {
              status: "ACTIVE",
            },
          },
        },
      },
    },
  });

  if (!club) return null;

  const viewerMembership =
    club.memberships.find((m) => m.userId === userId) ?? null;

  const officers = club.memberships
    .filter(
      (m) =>
        m.status === "ACTIVE" &&
        ["PRESIDENT", "SECRETARY", "TREASURER"].includes(m.role)
    )
    .map((m) => ({
      role: m.role,
      user: m.user,
    }));

  return {
    id: club.id,
    name: club.name,
    description: club.description,
    status: club.status,
    proposerId: club.proposerId,
    advisorId: club.advisorId,
    createdAt: club.createdAt,
    updatedAt: club.updatedAt,
    proposer: club.proposer,
    advisor: club.advisor,
    objectives: club.objectives,
    approvals: club.approvals,
    officers,
    viewerMembership: viewerMembership
      ? { role: viewerMembership.role, status: viewerMembership.status }
      : null,
    activeMemberCount: club._count.memberships,
  };
}
