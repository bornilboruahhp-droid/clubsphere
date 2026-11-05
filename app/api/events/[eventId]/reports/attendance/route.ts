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
    eventId: string;
  }>;
}

interface AttendanceExportRow {
  name: string;
  email: string;
  studentId: string;
  status: string;
  statusChangedAt: string;
  checkedInAt: string;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireUser();
    const { eventId } = await params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        clubId: true,
        club: {
          select: { id: true, advisorId: true },
        },
      },
    });

    if (!event) {
      throw notFound("Event not found");
    }

    // Role check: Admin, club advisor, or active club officer (President, Secretary, Treasurer)
    const isAdmin = user.role === "ADMIN";
    const isAdvisor = event.club.advisorId === user.id;

    if (!isAdmin && !isAdvisor) {
      const officerMembership = await prisma.membership.findFirst({
        where: {
          clubId: event.clubId,
          userId: user.id,
          status: "ACTIVE",
          role: { in: ["PRESIDENT", "SECRETARY", "TREASURER"] },
        },
        select: { id: true },
      });

      if (!officerMembership) {
        throw forbidden("You do not have permission to export event attendance");
      }
    }

    // Query registrations with user details
    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            studentId: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    });

    const rows: AttendanceExportRow[] = registrations.map((r) => ({
      name: r.user.name,
      email: r.user.email,
      studentId: r.user.studentId ?? "",
      status: r.status,
      statusChangedAt: r.statusChangedAt.toISOString(),
      checkedInAt: r.checkedInAt ? r.checkedInAt.toISOString() : "",
    }));

    const columns: CsvColumn<AttendanceExportRow>[] = [
      { header: "Name", accessor: (r) => r.name },
      { header: "Email", accessor: (r) => r.email },
      { header: "Student ID", accessor: (r) => r.studentId },
      { header: "Status", accessor: (r) => r.status },
      { header: "Status Changed At", accessor: (r) => r.statusChangedAt },
      { header: "Checked In At", accessor: (r) => r.checkedInAt },
    ];

    const csvContent = generateCsv(columns, rows);

    // Audit log: row count only, never row contents
    await logAudit(prisma, {
      actorId: user.id,
      action: AUDIT_ACTIONS.REPORT.EXPORTED,
      entityType: "event_attendance_report",
      entityId: event.id,
      clubId: event.clubId,
      metadata: {
        reportName: "event_attendance",
        rowCount: rows.length,
      },
    });

    const slug = event.title.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
    const filename = `${slug}_attendance_${formatFilenameDate()}.csv`;

    return createCsvResponse(csvContent, filename);
  } catch (error) {
    return handleError(error);
  }
}
