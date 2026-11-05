import { prisma } from "@/lib/prisma";
import type { User, ApprovalStage, ApprovalDecision, ClubStatus } from "@prisma/client";

export interface ReviewQueueClub {
  id: string;
  name: string;
  description: string;
  status: ClubStatus;
  createdAt: Date;
  proposer: {
    id: string;
    name: string;
    email: string;
    department: string | null;
    studentId: string | null;
  };
  advisor?: {
    id: string;
    name: string;
    department: string | null;
  } | null;
  objectives: {
    id: string;
    title: string;
    description: string | null;
  }[];
  approvals: {
    id: string;
    stage: ApprovalStage;
    decision: ApprovalDecision;
    comment: string | null;
    decidedAt: Date | null;
    reviewer?: {
      name: string;
    } | null;
  }[];
}

export interface DecidedReview {
  id: string;
  stage: ApprovalStage;
  decision: ApprovalDecision;
  comment: string | null;
  decidedAt: Date | null;
  createdAt: Date;
  club: {
    id: string;
    name: string;
    status: ClubStatus;
  };
}

/**
 * Retrieves the pending review queue for an ADVISOR or ADMIN.
 */
export async function getReviewQueue(user: User): Promise<ReviewQueueClub[]> {
  if (user.role === "ADVISOR") {
    const clubs = await prisma.club.findMany({
      where: {
        advisorId: user.id,
        status: "PENDING",
        approvals: {
          some: {
            stage: "ADVISOR",
            decision: "PENDING",
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        proposer: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            studentId: true,
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
      },
    });

    return clubs;
  }

  if (user.role === "ADMIN") {
    const clubs = await prisma.club.findMany({
      where: {
        status: "PENDING",
        approvals: {
          some: {
            stage: "ADMIN",
            decision: "PENDING",
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        proposer: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            studentId: true,
          },
        },
        advisor: {
          select: {
            id: true,
            name: true,
            department: true,
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
      },
    });

    return clubs;
  }

  return [];
}

/**
 * Retrieves recently decided reviews by this user.
 */
export async function getDecidedReviews(
  user: User,
  limit = 20
): Promise<DecidedReview[]> {
  const reviews = await prisma.clubApproval.findMany({
    where: {
      reviewerId: user.id,
      decision: {
        not: "PENDING",
      },
    },
    orderBy: {
      decidedAt: "desc",
    },
    take: limit,
    select: {
      id: true,
      stage: true,
      decision: true,
      comment: true,
      decidedAt: true,
      createdAt: true,
      club: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
  });

  return reviews;
}
