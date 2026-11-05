import { prisma } from "@/lib/prisma";
import type { ObjectiveStatus } from "@prisma/client";

export interface ClubObjectiveItem {
  id: string;
  clubId: string;
  title: string;
  description: string | null;
  status: ObjectiveStatus;
  targetDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  latestUpdate: {
    id: string;
    note: string;
    createdAt: Date;
    author: {
      id: string;
      name: string;
    };
  } | null;
  updateCount: number;
}

/**
 * Fetches all objectives for a club with their latest progress update and total update count.
 */
export async function getClubObjectives(clubId: string): Promise<ClubObjectiveItem[]> {
  const objectives = await prisma.clubObjective.findMany({
    where: { clubId },
    include: {
      updates: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          updates: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return objectives.map((obj) => ({
    id: obj.id,
    clubId: obj.clubId,
    title: obj.title,
    description: obj.description,
    status: obj.status,
    targetDate: obj.targetDate,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    latestUpdate: obj.updates[0] || null,
    updateCount: obj._count.updates,
  }));
}
