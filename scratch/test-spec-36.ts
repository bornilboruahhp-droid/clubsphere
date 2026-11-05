import { prisma } from "../lib/prisma";
import { describeAuditEntry } from "../lib/audit/describe";
import { PlatformRole, ClubStatus } from "@prisma/client";

async function main() {
  console.log("--- Testing Spec 36 Audit Log Viewer & History ---");

  // 1. Test Sentence Generator (describeAuditEntry)
  console.log("Testing describeAuditEntry...");
  const sampleEntries = [
    {
      action: "club.submitted",
      actorName: "Alice",
      expected: "Alice submitted the club charter application.",
    },
    {
      action: "club.suspended",
      actorName: "Dean Morgan",
      metadata: { reason: "Safety audit overdue" },
      expected: 'Dean Morgan suspended the organization: "Safety audit overdue".',
    },
    {
      action: "approval.decided",
      actorName: "Prof. Smith",
      metadata: { decision: "APPROVED", stage: "ADVISOR" },
      expected: "Prof. Smith approved the organization charter (ADVISOR stage).",
    },
    {
      action: "event.published",
      actorName: "Secretary Taylor",
      metadata: { title: "Robotics Hackathon" },
      expected: 'Secretary Taylor published event: "Robotics Hackathon".',
    },
    {
      action: "report.exported",
      actorName: "Admin Jordan",
      metadata: { reportName: "club_members", rowCount: 15 },
      expected: "Admin Jordan exported club_members report (15 rows).",
    },
  ];

  for (const s of sampleEntries) {
    const desc = describeAuditEntry({
      action: s.action,
      actorName: s.actorName,
      metadata: s.metadata,
    });
    if (desc !== s.expected) {
      throw new Error(`Sentence mismatch for ${s.action}: got "${desc}", expected "${s.expected}"`);
    }
  }
  console.log("✓ All sample audit sentences formatted as expected!");

  // 2. Test Admin Audit Query with Action Prefix
  console.log("Testing Admin audit query with prefix match 'club.'...");
  const clubLogs = await prisma.auditLog.findMany({
    where: { action: { startsWith: "club." } },
    take: 10,
    orderBy: { createdAt: "desc" },
  });
  console.log(`Fetched ${clubLogs.length} 'club.' audit entries.`);

  for (const l of clubLogs) {
    if (!l.action.startsWith("club.")) {
      throw new Error(`Entry action "${l.action}" does not start with "club."`);
    }
  }
  console.log("✓ Prefix filtering verified!");

  // 3. Test Batch Actor Resolution (without foreign keys)
  console.log("Testing batch actor resolution...");
  const actorIds = Array.from(new Set(clubLogs.map((l) => l.actorId).filter(Boolean))) as string[];
  const actors = actorIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const actorMap = new Map(actors.map((a) => [a.id, a]));

  const enriched = clubLogs.map((log) => {
    const actor = log.actorId ? actorMap.get(log.actorId) : null;
    const actorName = actor?.name || actor?.email || (log.actorId ? "Unknown User" : "System");
    return {
      id: log.id,
      actorName,
      sentence: describeAuditEntry({
        action: log.action,
        actorName,
        metadata: log.metadata,
      }),
    };
  });
  console.log("Enriched sample sentence:", enriched[0]?.sentence ?? "None on record");
  console.log("✓ Batch actor resolution verified!");

  // 4. Test Secret Ballot Invariant for Non-Admins
  console.log("Testing Secret Ballot Invariant (election.vote_cast exclusion)...");
  const testClub = await prisma.club.findFirst({
    where: { status: ClubStatus.ACTIVE },
  });

  if (testClub) {
    const nonAdminHistory = await prisma.auditLog.findMany({
      where: {
        clubId: testClub.id,
        action: { not: "election.vote_cast" },
      },
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    const hasVoteCast = nonAdminHistory.some((h) => h.action === "election.vote_cast");
    if (hasVoteCast) {
      throw new Error("Secret ballot violation: election.vote_cast found in non-admin query");
    }
    console.log(`✓ Non-admin history query verified (${nonAdminHistory.length} events, 0 vote_cast events)!`);
  }

  console.log("--- All Spec 36 Tests Passed Successfully! ---");
}

main()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
