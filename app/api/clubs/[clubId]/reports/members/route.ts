import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/get-current-user";
import { notFound, forbidden } from "@/lib/api/errors";
import { handleError } from "@/lib/api/response";
import { logAudit } from "@/lib/audit/log";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import {
  generateCsv,
  createCsvResponse,
  formatFilenameDate,
  CsvColumn,
} from "@/lib/reports/csv";

interface RouteParams {
  params: Promise<{
    clubId: string;
  }>;
}

interface MemberExportRow {
  name: string;
  email: string;
  studentId: string;
  department: string;
  role: string;
  joinedAt: string;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireUser();
    const { clubId } = await params;

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, name: true, advisorId: true },
    });

    if (!club) {
      throw notFound("Club not found");
    }

    // Role check: Admin, assigned Advisor, or active Officer (President, Secretary, Treasurer)
    const isAdmin = user.role === "ADMIN";
    const isAdvisor = club.advisorId === user.id;

    if (!isAdmin && !isAdvisor) {
      const officerMembership = await prisma.membership.findFirst({
        where: {
          clubId,
          userId: user.id,
          status: "ACTIVE",
          role: { in: ["PRESIDENT", "SECRETARY", "TREASURER"] },
        },
        select: { id: true },
      });

      if (!officerMembership) {
        throw forbidden("You do not have permission to export the member roster");
      }
    }

    // Query active members
    const memberships = await prisma.membership.findMany({
      where: {
        clubId,
        status: "ACTIVE",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            studentId: true,
            department: true,
          },
        },
      },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    });

    const rows: MemberExportRow[] = memberships.map((m) => ({
      name: m.user.name,
      email: m.user.email,
      studentId: m.user.studentId ?? "",
      department: m.user.department ?? "",
      role: m.role,
      joinedAt: m.createdAt.toISOString(),
    }));

    const columns: CsvColumn<MemberExportRow>[] = [
      { header: "Name", accessor: (r) => r.name },
      { header: "Email", accessor: (r) => r.email },
      { header: "Student ID", accessor: (r) => r.studentId },
      { header: "Department", accessor: (r) => r.department },
      { header: "Role", accessor: (r) => r.role },
      { header: "Joined At", accessor: (r) => r.joinedAt },
    ];

    const csvContent = generateCsv(columns, rows);

    // Audit log: row count only, never log row contents
    await logAudit(prisma, {
      actorId: user.id,
      action: AUDIT_ACTIONS.REPORT.EXPORTED,
      entityType: "club_members_report",
      entityId: club.id,
      clubId: club.id,
      metadata: {
        reportName: "club_members",
        rowCount: rows.length,
      },
    });

    const slug = club.name.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
    const filename = `${slug}_members_${formatFilenameDate()}.csv`;

    return createCsvResponse(csvContent, filename);
  } catch (error) {
    return handleError(error);
  }
}
