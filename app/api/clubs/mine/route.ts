import { requireUser } from "@/lib/auth/get-current-user";
import { ok, handleError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireUser();

    const clubs = await prisma.club.findMany({
      where: {
        OR: [
          { proposerId: user.id },
          { memberships: { some: { userId: user.id } } },
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
            id: true,
            name: true,
            department: true,
          },
        },
        memberships: {
          where: {
            userId: user.id,
          },
          select: {
            id: true,
            role: true,
            status: true,
            joinedAt: true,
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

    const transformed = clubs.map((club) => {
      const myMembership = club.memberships[0] ?? null;
      return {
        id: club.id,
        name: club.name,
        description: club.description,
        status: club.status,
        createdAt: club.createdAt,
        updatedAt: club.updatedAt,
        advisor: club.advisor,
        isProposer: club.proposerId === user.id,
        myMembership: myMembership
          ? {
              role: myMembership.role,
              status: myMembership.status,
              joinedAt: myMembership.joinedAt,
            }
          : null,
        activeMemberCount: club._count.memberships,
      };
    });

    return ok(transformed);
  } catch (err) {
    return handleError(err);
  }
}
