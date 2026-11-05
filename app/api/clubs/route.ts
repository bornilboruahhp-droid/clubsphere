import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/get-current-user";
import { requireProfileComplete } from "@/lib/access";
import { ok, paginated, handleError } from "@/lib/api/response";
import { validationError, conflict } from "@/lib/api/errors";
import {
  clubRegistrationSchema,
  clubListQuerySchema,
} from "@/lib/validation/club";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/log";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { notifyUser } from "@/lib/notifications/notify";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    requireProfileComplete(user);

    const body = await req.json();
    const validated = clubRegistrationSchema.parse(body);

    // Verify advisorId belongs to an existing user with role ADVISOR
    const advisor = await prisma.user.findUnique({
      where: { id: validated.advisorId },
      select: { id: true, role: true, name: true },
    });

    if (!advisor || advisor.role !== "ADVISOR") {
      throw validationError("Selected advisor must be a faculty advisor", {
        advisorId: "Selected advisor must have the ADVISOR role",
      });
    }

    // Check case-insensitive unique club name
    const existing = await prisma.club.findFirst({
      where: {
        name: {
          equals: validated.name,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (existing) {
      throw conflict("A club with this name already exists", {
        name: "This club name is already taken",
      });
    }

    // Atomic transaction
    const club = await prisma.$transaction(async (tx) => {
      // 1. Create Club with status PENDING
      const createdClub = await tx.club.create({
        data: {
          name: validated.name,
          description: validated.description,
          status: "PENDING",
          proposerId: user.id,
          advisorId: validated.advisorId,
        },
      });

      // 2. Create proposer's Membership with role PRESIDENT and status ACTIVE
      await tx.membership.create({
        data: {
          clubId: createdClub.id,
          userId: user.id,
          role: "PRESIDENT",
          status: "ACTIVE",
          joinedAt: new Date(),
        },
      });

      // 3. Create ClubObjective rows (status PLANNED)
      await tx.clubObjective.createMany({
        data: validated.objectives.map((title) => ({
          clubId: createdClub.id,
          title,
          status: "PLANNED" as const,
        })),
      });

      // 4. Create ClubApproval for stage ADVISOR with decision PENDING
      await tx.clubApproval.create({
        data: {
          clubId: createdClub.id,
          stage: "ADVISOR",
          decision: "PENDING",
        },
      });

      // 5. Write audit entry club.submitted
      await logAudit(
        tx,
        {
          actorId: user.id,
          action: AUDIT_ACTIONS.CLUB.SUBMITTED,
          entityType: "Club",
          entityId: createdClub.id,
          clubId: createdClub.id,
          metadata: {
            name: createdClub.name,
            advisorId: createdClub.advisorId,
            objectiveCount: validated.objectives.length,
          },
        }
      );

      return createdClub;
    });

    // Notify advisor after commit (side effect)
    await notifyUser({
      userId: validated.advisorId,
      type: "CLUB_REVIEW_REQUESTED",
      title: `New club registration for review: ${club.name}`,
      body: `${user.name} submitted a registration for "${club.name}" and selected you as faculty advisor.`,
      href: "/reviews",
    });

    return ok(club, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}

export async function GET(req: NextRequest) {
  try {
    await requireUser();

    const searchParams = Object.fromEntries(req.nextUrl.searchParams);
    const { q, cursor, limit } = clubListQuerySchema.parse(searchParams);

    const where: any = {
      status: "ACTIVE",
    };

    if (q) {
      where.name = {
        contains: q,
        mode: "insensitive",
      };
    }

    const clubs = await prisma.club.findMany({
      where,
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
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
        proposer: {
          select: {
            id: true,
            name: true,
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

    let nextCursor: string | null = null;
    if (clubs.length > limit) {
      const nextItem = clubs.pop();
      nextCursor = nextItem?.id ?? null;
    }

    return paginated(clubs, nextCursor);
  } catch (err) {
    return handleError(err);
  }
}
