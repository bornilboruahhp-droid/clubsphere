import {
  parseRange,
  getAdminStatCards,
  getClubsByStatus,
  getNewMembershipsPerMonth,
  getEventsHeldPerMonth,
  getAdminExceptions,
} from "../lib/analytics/admin";

async function main() {
  console.log("--- Testing Spec 32 Admin Analytics ---");

  // 1. Test range parsing
  const r30 = parseRange("30d");
  const r90 = parseRange("90d");
  const r12 = parseRange("12m");
  const rDefault = parseRange(undefined);

  console.log("Range test:", {
    r30: r30.label,
    r90: r90.label,
    r12: r12.label,
    rDefault: rDefault.label,
  });

  if (rDefault.range !== "30d" || r90.range !== "90d" || r12.range !== "12m") {
    throw new Error("Range parsing mismatch");
  }

  // 2. Test getAdminStatCards
  console.log("Fetching stat cards for 30d...");
  const stats30 = await getAdminStatCards("30d");
  console.log("Stat cards (30d):", stats30);

  console.log("Fetching stat cards for 12m...");
  const stats12m = await getAdminStatCards("12m");
  console.log("Stat cards (12m):", stats12m);

  if (
    typeof stats30.activeClubs !== "number" ||
    typeof stats30.pendingApprovals !== "number" ||
    typeof stats30.activeMembers !== "number" ||
    typeof stats30.eventsHeld !== "number"
  ) {
    throw new Error("Invalid stat cards data shape");
  }

  // 3. Test getClubsByStatus
  console.log("Fetching clubs by status...");
  const clubsByStatus = await getClubsByStatus();
  console.log("Clubs by status:", clubsByStatus);

  if (clubsByStatus.length !== 4) {
    throw new Error(`Expected 4 status items, got ${clubsByStatus.length}`);
  }

  // 4. Test getNewMembershipsPerMonth
  console.log("Fetching memberships per month (12m)...");
  const memberTrends = await getNewMembershipsPerMonth("12m");
  console.log(`Member trends length: ${memberTrends.length}, sample:`, memberTrends.slice(-3));

  if (!Array.isArray(memberTrends) || memberTrends.length === 0) {
    throw new Error("Expected monthly buckets for member trends");
  }

  // 5. Test getEventsHeldPerMonth
  console.log("Fetching events held per month (12m)...");
  const eventTrends = await getEventsHeldPerMonth("12m");
  console.log(`Event trends length: ${eventTrends.length}, sample:`, eventTrends.slice(-3));

  if (!Array.isArray(eventTrends) || eventTrends.length === 0) {
    throw new Error("Expected monthly buckets for event trends");
  }

  // 6. Test getAdminExceptions
  console.log("Fetching admin exceptions...");
  const exceptions = await getAdminExceptions();
  console.log("Exceptions summary:", {
    overdueApprovalsCount: exceptions.overdueApprovals.length,
    inactiveClubsCount: exceptions.inactiveClubs.length,
    sampleOverdue: exceptions.overdueApprovals[0] ?? null,
    sampleInactive: exceptions.inactiveClubs[0] ?? null,
  });

  console.log("--- All Spec 32 Analytics Queries Verified Successfully! ---");
}

main()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
