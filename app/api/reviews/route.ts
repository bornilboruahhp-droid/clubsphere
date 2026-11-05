import { requireUser } from "@/lib/auth/get-current-user";
import { forbidden } from "@/lib/api/errors";
import { ok, handleError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireUser();

    if (user.role !== "ADVISOR" && user.role !== "ADMIN") {
      throw forbidden("Review access requires ADVISOR or ADMIN role");
    }

    if (user.role === "ADVISOR") {
      // Clubs assigned to this advisor whose ADVISOR stage is PENDING
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
            where: {
              stage: "ADVISOR",
            },
            select: {
              id: true,
              stage: true,
              decision: true,
              createdAt: true,
            },
          },
        },
      });

      return ok(clubs);
    }

    // Platform ADMIN: clubs whose ADMIN stage is PENDING
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
          select: {
            id: true,
            stage: true,
            decision: true,
            comment: true,
            decidedAt: true,
            createdAt: true,
            reviewer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return ok(clubs);
  } catch (err) {
    return handleError(err);
  }
}
