import { requireUser } from "@/lib/auth/get-current-user";
import { ok, handleError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireUser();

    const advisors = await prisma.user.findMany({
      where: {
        role: "ADVISOR",
      },
      select: {
        id: true,
        name: true,
        department: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return ok(advisors);
  } catch (err) {
    return handleError(err);
  }
}
