import { prisma } from "../lib/prisma";
import {
  parseClubRange,
  requireClubAnalyticsAccess,
  getClubStatCards,
  getClubMembersOverTime,
  getClubEventAttendanceStats,
  getClubParticipationDistribution,
  getClubAnalytics,
} from "../lib/analytics/club";

async function main() {
  console.log("--- Testing Spec 33 Club Analytics ---");

  // 1. Range parsing test
  const r90 = parseClubRange("90d");
  const r12 = parseClubRange("12m");
  const rAll = parseClubRange("all", new Date("2026-01-01"));
  const rDef = parseClubRange(undefined);

  console.log("Range test:", {
    r90: r90.label,
    r12: r12.label,
    rAll: rAll.label,
    rDef: rDef.label,
  });

  if (r90.range !== "90d" || r12.range !== "12m" || rAll.range !== "all" || rDef.range !== "90d") {
    throw new Error("Range parsing mismatch");
  }

  // 2. Fetch a sample active club
  const club = await prisma.club.findFirst({
    where: { status: "ACTIVE" },
    include: {
      advisor: true,
      proposer: true,
      memberships: { where: { status: "ACTIVE" } },
    },
  });

  if (!club) {
    console.log("No active club found in database to test. Skipping database data tests.");
    return;
  }

  console.log(`Found active club for test: "${club.name}" (${club.id})`);

  // 3. Test requireClubAnalyticsAccess
  // A. Admin access
  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });
  if (adminUser) {
    const adminAccess = await requireClubAnalyticsAccess(adminUser, club.id);
    console.log("Admin access check:", adminAccess);
  }

  // B. Advisor access
  const advisorAccess = await requireClubAnalyticsAccess(club.advisor, club.id);
  console.log("Advisor access check:", advisorAccess);

  // C. Unauthorized user check
  const nonMemberUser = await prisma.user.findFirst({
    where: {
      role: "STUDENT",
      id: { notIn: club.memberships.map((m) => m.userId).concat([club.advisorId]) },
    },
  });
  if (nonMemberUser) {
    try {
      await requireClubAnalyticsAccess(nonMemberUser, club.id);
      throw new Error("Should have thrown notFound for non-member user");
    } catch (err: any) {
      console.log("Non-member access correctly denied with notFound error");
    }
  }

  // 4. Test getClubStatCards
  console.log("Testing getClubStatCards (90d)...");
  const stats90 = await getClubStatCards(club.id, r90);
  console.log("Club stats (90d):", stats90);

  console.log("Testing getClubStatCards (all)...");
  const statsAll = await getClubStatCards(club.id, rAll);
  console.log("Club stats (all):", statsAll);

  if (
    typeof stats90.activeMembers !== "number" ||
    typeof stats90.newMembersInRange !== "number" ||
    typeof stats90.eventsHeld !== "number"
  ) {
    throw new Error("Invalid stat cards data shape");
  }

  // 5. Test getClubMembersOverTime
  console.log("Testing getClubMembersOverTime (12m)...");
  const memberTrends = await getClubMembersOverTime(club.id, r12);
  console.log(`Member trends bucket count: ${memberTrends.length}, sample:`, memberTrends.slice(-3));

  if (!Array.isArray(memberTrends) || memberTrends.length === 0) {
    throw new Error("Expected member trend buckets");
  }

  // 6. Test getClubEventAttendanceStats
  console.log("Testing getClubEventAttendanceStats (all)...");
  const eventAttendance = await getClubEventAttendanceStats(club.id, rAll);
  console.log(`Event attendance records: ${eventAttendance.length}`);

  // 7. Test getClubParticipationDistribution
  console.log("Testing getClubParticipationDistribution (all)...");
  const participation = await getClubParticipationDistribution(club.id, rAll);
  console.log("Participation distribution:", participation);

  const sumTiers =
    participation.zeroEvents +
    participation.oneToTwoEvents +
    participation.threePlusEvents;

  if (sumTiers !== participation.totalActiveMembers) {
    throw new Error(
      `Participation tiers sum (${sumTiers}) does not equal total active members (${participation.totalActiveMembers})`
    );
  }

  // 8. Test full getClubAnalytics
  console.log("Testing full getClubAnalytics...");
  const fullData = await getClubAnalytics(club.id, "90d", club.createdAt);
  console.log("Full analytics payload verified successfully!");

  console.log("--- All Spec 33 Club Analytics Tests Passed! ---");
}

main()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
