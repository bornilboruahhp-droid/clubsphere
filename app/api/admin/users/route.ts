import { NextRequest } from "next/server";
import { PlatformRole, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/get-current-user";
import { requireAdmin } from "@/lib/access";
import { ok, paginated, handleError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    requireAdmin(user);

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const roleParam = searchParams.get("role")?.trim();
    const cursor = searchParams.get("cursor")?.trim();
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 50), 1), 100);

    const where: Prisma.UserWhereInput = {};

    // Role filter
    if (
      roleParam &&
      Object.values(PlatformRole).includes(roleParam as PlatformRole)
    ) {
      where.role = roleParam as PlatformRole;
    }

    // Search query filter (name, email, studentId)
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { studentId: { contains: q, mode: "insensitive" } },
        { department: { contains: q, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        name: true,
        email: true,
        studentId: true,
        department: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            memberships: {
              where: { status: "ACTIVE" },
            },
            advisedClubs: {
              where: { status: { in: ["PENDING", "ACTIVE"] } },
            },
          },
        },
      },
      orderBy: [{ role: "desc" }, { name: "asc" }],
    });

    const hasMore = users.length > limit;
    const items = hasMore ? users.slice(0, limit) : users;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return paginated(items, nextCursor);
  } catch (error) {
    return handleError(error);
  }
}
