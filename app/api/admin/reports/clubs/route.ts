import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/get-current-user";
import { requireAdmin } from "@/lib/access";
import { handleError } from "@/lib/api/response";
import { logAudit } from "@/lib/audit/log";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import {
  generateCsv,
  createCsvResponse,
  formatFilenameDate,
  CsvColumn,
} from "@/lib/reports/csv";

interface AdminClubExportRow {
  name: string;
  status: string;
  advisor: string;
  members: number;
  eventsHeld: number;
  createdDate: string;
}

export async function GET(_request: NextRequest) {
  try {
    const user = await requireUser();
    requireAdmin(user);

    // Query all clubs with advisor and aggregated counts
    const clubs = await prisma.club.findMany({
      include: {
        advisor: {
          select: { name: true, email: true },
        },
        _count: {
          select: {
            memberships: {
              where: { status: "ACTIVE" },
            },
            events: {
              where: { status: "COMPLETED" },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const rows: AdminClubExportRow[] = clubs.map((c) => ({
      name: c.name,
      status: c.status,
      advisor: c.advisor.name,
      members: c._count.memberships,
      eventsHeld: c._count.events,
      createdDate: c.createdAt.toISOString(),
    }));

    const columns: CsvColumn<AdminClubExportRow>[] = [
      { header: "Club Name", accessor: (r) => r.name },
      { header: "Status", accessor: (r) => r.status },
      { header: "Faculty Advisor", accessor: (r) => r.advisor },
      { header: "Active Members", accessor: (r) => r.members },
      { header: "Events Held", accessor: (r) => r.eventsHeld },
      { header: "Created Date", accessor: (r) => r.createdDate },
    ];

    const csvContent = generateCsv(columns, rows);

    // Audit log: row count only, never row contents
    await logAudit(prisma, {
      actorId: user.id,
      action: AUDIT_ACTIONS.REPORT.EXPORTED,
      entityType: "admin_clubs_report",
      entityId: "all_clubs",
      metadata: {
        reportName: "admin_clubs",
        rowCount: rows.length,
      },
    });

    const filename = `campus_clubs_report_${formatFilenameDate()}.csv`;

    return createCsvResponse(csvContent, filename);
  } catch (error) {
    return handleError(error);
  }
}
