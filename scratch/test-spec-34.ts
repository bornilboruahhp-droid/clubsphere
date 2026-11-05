import { prisma } from "../lib/prisma";
import { sanitizeCell, generateCsv, formatFilenameDate } from "../lib/reports/csv";
import { AUDIT_ACTIONS } from "../lib/audit/actions";
import { logAudit } from "../lib/audit/log";

async function main() {
  console.log("--- Testing Spec 34 CSV Reports & Exports ---");

  // 1. Formula Injection Mitigation & Escaping Tests
  console.log("Testing cell sanitization...");
  const maliciousCells = [
    { input: "=1+1", expected: "'=1+1" },
    { input: "+cmd|' /C calc'!A0", expected: "'+cmd|' /C calc'!A0" },
    { input: "-5", expected: "'-5" },
    { input: "@SUM(A1:A10)", expected: "'@SUM(A1:A10)" },
    { input: 'Normal "Text"', expected: '"Normal ""Text"""' },
    { input: "Hello, World", expected: '"Hello, World"' },
    { input: "Line 1\nLine 2", expected: '"Line 1\nLine 2"' },
    { input: null, expected: "" },
    { input: undefined, expected: "" },
    { input: 12345, expected: "12345" },
  ];

  for (const { input, expected } of maliciousCells) {
    const result = sanitizeCell(input);
    if (result !== expected) {
      throw new Error(`Sanitization failed for ${JSON.stringify(input)}: got ${JSON.stringify(result)}, expected ${JSON.stringify(expected)}`);
    }
  }
  console.log("✓ Formula injection and RFC 4180 escaping verified!");

  // 2. UTF-8 BOM and CSV Generation Test
  console.log("Testing CSV generator output...");
  const sampleColumns = [
    { header: "Name", accessor: (r: any) => r.name },
    { header: "Code", accessor: (r: any) => r.code },
  ];
  const sampleRows = [
    { name: "Alice", code: "=123" },
    { name: "Bob, Jr.", code: "OK" },
  ];
  const csv = generateCsv(sampleColumns, sampleRows);

  if (!csv.startsWith("\uFEFF")) {
    throw new Error("CSV does not begin with UTF-8 BOM (\\uFEFF)");
  }
  console.log("✓ UTF-8 BOM verified!");

  // 3. Row Limit Guard Test (10,000 max)
  console.log("Testing 10,000 row cap...");
  const bigRows = new Array(10001).fill({ name: "Test", code: "1" });
  try {
    generateCsv(sampleColumns, bigRows);
    throw new Error("Should have thrown 409 Conflict for >10,000 rows");
  } catch (err: any) {
    if (err.status !== 409) {
      throw new Error(`Expected status code 409, got ${err.status}`);
    }
    console.log("✓ 10,000 row limit correctly rejected with 409 Conflict!");
  }

  // 4. Test Audit Logging for Report Export
  console.log("Testing report.exported audit logging...");
  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!adminUser) {
    console.log("No admin user found. Skipping DB audit test.");
    return;
  }

  const auditEntry = await logAudit(prisma, {
    actorId: adminUser.id,
    action: AUDIT_ACTIONS.REPORT.EXPORTED,
    entityType: "test_report",
    entityId: "test_entity",
    metadata: {
      reportName: "test_spec_34",
      rowCount: 42,
    },
  });

  console.log("Created audit entry:", {
    id: auditEntry.id,
    action: auditEntry.action,
    entityType: auditEntry.entityType,
    metadata: auditEntry.metadata,
  });

  if (auditEntry.action !== "report.exported") {
    throw new Error("Audit action mismatch");
  }
  console.log("✓ Audit log recorded report.exported event successfully!");

  // 5. Test Club Members Query & Column Format
  const sampleClub = await prisma.club.findFirst({
    where: { status: "ACTIVE" },
  });

  if (sampleClub) {
    const memberships = await prisma.membership.findMany({
      where: { clubId: sampleClub.id, status: "ACTIVE" },
      include: { user: true },
    });

    const memberRows = memberships.map((m) => ({
      name: m.user.name,
      email: m.user.email,
      studentId: m.user.studentId ?? "",
      department: m.user.department ?? "",
      role: m.role,
      joinedAt: m.createdAt.toISOString(),
    }));

    const memberCols = [
      { header: "Name", accessor: (r: any) => r.name },
      { header: "Email", accessor: (r: any) => r.email },
      { header: "Student ID", accessor: (r: any) => r.studentId },
      { header: "Department", accessor: (r: any) => r.department },
      { header: "Role", accessor: (r: any) => r.role },
      { header: "Joined At", accessor: (r: any) => r.joinedAt },
    ];

    const clubMembersCsv = generateCsv(memberCols, memberRows);
    console.log(`✓ Club members CSV generated successfully (${memberRows.length} rows)`);
  }

  console.log("--- All Spec 34 Tests Passed Successfully! ---");
}

main()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
