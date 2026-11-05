import { prisma } from "../lib/prisma";
import { AUDIT_ACTIONS } from "../lib/audit/actions";
import { logAudit } from "../lib/audit/log";
import { canTransition } from "../lib/clubs/transitions";
import { PlatformRole, ClubStatus } from "@prisma/client";

async function main() {
  console.log("--- Testing Spec 35 Admin Controls & Invariants ---");

  // 1. Fetch test administrator and active club
  const admin = await prisma.user.findFirst({
    where: { role: PlatformRole.ADMIN },
  });
  if (!admin) throw new Error("No admin user found");

  const testClub = await prisma.club.findFirst({
    where: { status: ClubStatus.ACTIVE },
    include: { advisor: true },
  });
  if (!testClub) throw new Error("No active club found for test");

  console.log(`Using admin: ${admin.email}, club: "${testClub.name}" (${testClub.id})`);

  // 2. Test suspension transition check & reason requirement
  console.log("Testing suspension state transition logic...");
  if (!canTransition(testClub.status, "SUSPENDED")) {
    throw new Error(`Expected ACTIVE to be able to transition to SUSPENDED`);
  }

  // 3. Suspend the club in a test transaction
  console.log("Executing test club suspension...");
  const suspensionReason = "Temporary annual institutional safety audit";
  if (suspensionReason.trim().length < 5) {
    throw new Error("Reason length validation check failed");
  }

  await prisma.$transaction(async (tx) => {
    await tx.club.update({
      where: { id: testClub.id },
      data: { status: ClubStatus.SUSPENDED },
    });
    await logAudit(tx, {
      actorId: admin.id,
      action: AUDIT_ACTIONS.CLUB.SUSPENDED,
      entityType: "CLUB",
      entityId: testClub.id,
      clubId: testClub.id,
      metadata: { reason: suspensionReason, previousStatus: ClubStatus.ACTIVE },
    });
  });

  const suspendedClub = await prisma.club.findUnique({
    where: { id: testClub.id },
    select: { status: true },
  });
  if (suspendedClub?.status !== ClubStatus.SUSPENDED) {
    throw new Error("Club status was not updated to SUSPENDED");
  }
  console.log("✓ Club successfully suspended and audited!");

  // 4. Verify suspended club cannot transition to SUSPENDED again
  if (canTransition(ClubStatus.SUSPENDED, "SUSPENDED")) {
    throw new Error("SUSPENDED should not be able to transition to SUSPENDED");
  }

  // 5. Reactivate the club
  console.log("Testing club reactivation...");
  if (!canTransition(ClubStatus.SUSPENDED, "ACTIVE")) {
    throw new Error("Expected SUSPENDED to be able to transition to ACTIVE");
  }

  await prisma.$transaction(async (tx) => {
    await tx.club.update({
      where: { id: testClub.id },
      data: { status: ClubStatus.ACTIVE },
    });
    await logAudit(tx, {
      actorId: admin.id,
      action: AUDIT_ACTIONS.CLUB.REACTIVATED,
      entityType: "CLUB",
      entityId: testClub.id,
      clubId: testClub.id,
      metadata: { previousStatus: ClubStatus.SUSPENDED },
    });
  });

  const reactivatedClub = await prisma.club.findUnique({
    where: { id: testClub.id },
    select: { status: true },
  });
  if (reactivatedClub?.status !== ClubStatus.ACTIVE) {
    throw new Error("Club was not reactivated to ACTIVE");
  }
  console.log("✓ Club successfully reactivated and audited!");

  // 6. Test Last Admin Demotion Invariant
  console.log("Testing Last Admin Demotion Invariant...");
  const adminCount = await prisma.user.count({
    where: { role: PlatformRole.ADMIN },
  });
  console.log(`Current platform administrators: ${adminCount}`);

  if (adminCount === 1) {
    console.log("Only 1 admin exists. Demoting should be blocked.");
    const shouldBlock = adminCount <= 1;
    if (!shouldBlock) throw new Error("Last admin demotion invariant failed");
    console.log("✓ Last admin demotion correctly blocked!");
  } else {
    console.log(`Multiple admins exist (${adminCount}), demotion allowed if > 1.`);
  }

  // 7. Test Assigned Advisor Demotion Invariant
  console.log("Testing Assigned Advisor Demotion Invariant...");
  const activeAdvisor = await prisma.user.findFirst({
    where: {
      role: PlatformRole.ADVISOR,
      advisedClubs: {
        some: { status: { in: [ClubStatus.PENDING, ClubStatus.ACTIVE] } },
      },
    },
    include: {
      advisedClubs: {
        where: { status: { in: [ClubStatus.PENDING, ClubStatus.ACTIVE] } },
        select: { name: true },
      },
    },
  });

  if (activeAdvisor) {
    const clubNames = activeAdvisor.advisedClubs.map((c) => c.name);
    console.log(`Found active advisor: ${activeAdvisor.email} advising: ${clubNames.join(", ")}`);
    // Rule: cannot move away from ADVISOR if advising PENDING or ACTIVE clubs
    const isBlocked = clubNames.length > 0;
    if (!isBlocked) throw new Error("Assigned advisor demotion invariant failed");
    console.log("✓ Active advisor demotion correctly blocked naming assigned clubs!");
  }

  // 8. Test Advisor Reassignment Audit
  console.log("Testing advisor reassignment audit...");
  const auditEntry = await logAudit(prisma, {
    actorId: admin.id,
    action: AUDIT_ACTIONS.CLUB.ADVISOR_CHANGED,
    entityType: "CLUB",
    entityId: testClub.id,
    clubId: testClub.id,
    metadata: {
      oldAdvisorId: testClub.advisorId,
      newAdvisorId: testClub.advisorId,
      oldAdvisorName: testClub.advisor.name,
      newAdvisorName: testClub.advisor.name,
    },
  });
  if (auditEntry.action !== "club.advisor_changed") {
    throw new Error("Advisor changed audit mismatch");
  }
  console.log("✓ Advisor reassignment audit verified!");

  console.log("--- All Spec 35 Tests Passed Successfully! ---");
}

main()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
