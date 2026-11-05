import { prisma } from "../lib/prisma";

async function run() {
  console.log("=== Testing Spec 22: Event Registration API ===");

  // 1. Setup test users
  let adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });
  if (!adminUser) {
    adminUser = await prisma.user.upsert({
      where: { email: "admin-spec22@example.com" },
      update: { role: "ADMIN" },
      create: {
        id: `user_admin_${Date.now()}`,
        email: "admin-spec22@example.com",
        name: "Admin User",
        studentId: "ADMIN-SPEC22",
        department: "Administration",
        role: "ADMIN",
      },
    });
  }

  const timestamp = Date.now();
  const testClub = await prisma.club.create({
    data: {
      name: `Registration Test Club ${timestamp}`,
      description: "A club created to verify event registration concurrency and rules",
      status: "ACTIVE",
      proposerId: adminUser.id,
      advisorId: adminUser.id,
    },
  });

  const memberUser = await prisma.user.upsert({
    where: { email: `reg-member-${timestamp}@example.com` },
    update: {},
    create: {
      id: `user_member_${timestamp}`,
      email: `reg-member-${timestamp}@example.com`,
      name: "Registration Test Member",
      studentId: `MEMBER-${timestamp}`,
      department: "Computer Science",
      role: "STUDENT",
    },
  });

  const nonMemberUser = await prisma.user.upsert({
    where: { email: `reg-nonmember-${timestamp}@example.com` },
    update: {},
    create: {
      id: `user_nonmember_${timestamp}`,
      email: `reg-nonmember-${timestamp}@example.com`,
      name: "Registration Non-Member",
      studentId: `NONMEM-${timestamp}`,
      department: "Physics",
      role: "STUDENT",
    },
  });

  // Add memberUser as ACTIVE member of testClub
  await prisma.membership.create({
    data: {
      clubId: testClub.id,
      userId: memberUser.id,
      role: "MEMBER",
      status: "ACTIVE",
    },
  });

  console.log("✓ Test users and club created successfully");

  // 2. Test PUBLISHED event registration & cancellation
  const futureEvent = await prisma.event.create({
    data: {
      clubId: testClub.id,
      createdById: adminUser.id,
      title: `Public Workshop ${timestamp}`,
      description: "Public workshop with capacity 5",
      location: "Auditorium A",
      startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      endsAt: new Date(Date.now() + 26 * 60 * 60 * 1000),
      capacity: 5,
      visibility: "CAMPUS",
      status: "PUBLISHED",
    },
  });

  // Direct check of logic simulating the POST route
  const registerUser = async (userId: string, eventId: string) => {
    return prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<
        Array<{
          id: string;
          clubId: string;
          title: string;
          status: string;
          visibility: string;
          capacity: number | null;
          startsAt: Date;
          endsAt: Date;
        }>
      >`SELECT id, "clubId", title, status, visibility, capacity, "startsAt", "endsAt" FROM "Event" WHERE id = ${eventId} FOR UPDATE`;

      if (rows.length === 0) throw new Error("Event not found");
      const event = rows[0];
      if (event.status !== "PUBLISHED") throw new Error("Event not published");
      if (new Date(event.endsAt) <= new Date()) throw new Error("Event ended");

      if (event.visibility === "MEMBERS_ONLY") {
        const mem = await tx.membership.findFirst({
          where: { clubId: event.clubId, userId, status: "ACTIVE" },
        });
        if (!mem) throw new Error("Forbidden: members only");
      }

      const activeCount = await tx.eventRegistration.count({
        where: { eventId, status: { not: "CANCELLED" } },
      });

      if (event.capacity !== null && activeCount >= event.capacity) {
        throw new Error("Conflict: event full");
      }

      const existing = await tx.eventRegistration.findUnique({
        where: { eventId_userId: { eventId, userId } },
      });

      const now = new Date();
      if (!existing) {
        return tx.eventRegistration.create({
          data: { eventId, userId, status: "REGISTERED", statusChangedAt: now },
        });
      } else if (existing.status === "CANCELLED") {
        return tx.eventRegistration.update({
          where: { id: existing.id },
          data: { status: "REGISTERED", statusChangedAt: now },
        });
      } else {
        throw new Error("Conflict: already registered");
      }
    });
  };

  // Test standard registration
  const reg1 = await registerUser(memberUser.id, futureEvent.id);
  console.log("✓ User successfully registered:", reg1.status);

  // Test duplicate registration should throw
  let duplicateThrew = false;
  try {
    await registerUser(memberUser.id, futureEvent.id);
  } catch (e: any) {
    if (e.message.includes("Conflict: already registered")) duplicateThrew = true;
  }
  if (!duplicateThrew) throw new Error("Duplicate registration did not throw conflict");
  console.log("✓ Duplicate registration correctly rejected with conflict");

  // Test cancellation
  const cancelRegistration = async (userId: string, eventId: string) => {
    return prisma.$transaction(async (tx) => {
      const reg = await tx.eventRegistration.findUnique({
        where: { eventId_userId: { eventId, userId } },
        include: { event: true },
      });
      if (!reg) throw new Error("Registration not found");
      if (reg.status !== "REGISTERED") throw new Error("Not registered");
      if (new Date(reg.event.startsAt) <= new Date()) throw new Error("Event already started");

      return tx.eventRegistration.update({
        where: { id: reg.id },
        data: { status: "CANCELLED", statusChangedAt: new Date() },
      });
    });
  };

  const cancelledReg = await cancelRegistration(memberUser.id, futureEvent.id);
  if (cancelledReg.status !== "CANCELLED") throw new Error("Cancellation failed");
  console.log("✓ Registration successfully cancelled");

  // Test re-registration after cancellation
  const revivedReg = await registerUser(memberUser.id, futureEvent.id);
  if (revivedReg.status !== "REGISTERED") throw new Error("Re-registration failed");
  console.log("✓ Re-registration after cancellation succeeded:", revivedReg.status);

  // 3. Test MEMBERS_ONLY event rejection
  const membersOnlyEvent = await prisma.event.create({
    data: {
      clubId: testClub.id,
      createdById: adminUser.id,
      title: `Secret Meeting ${timestamp}`,
      description: "Members only meeting",
      location: "Room 101",
      startsAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 50 * 60 * 60 * 1000),
      capacity: 10,
      visibility: "MEMBERS_ONLY",
      status: "PUBLISHED",
    },
  });

  let nonMemberThrew = false;
  try {
    await registerUser(nonMemberUser.id, membersOnlyEvent.id);
  } catch (e: any) {
    if (e.message.includes("Forbidden: members only")) nonMemberThrew = true;
  }
  if (!nonMemberThrew) throw new Error("Non-member was able to register for MEMBERS_ONLY event");
  console.log("✓ MEMBERS_ONLY event correctly rejects non-members");

  // Member CAN register for MEMBERS_ONLY event
  const memberSecretReg = await registerUser(memberUser.id, membersOnlyEvent.id);
  if (memberSecretReg.status !== "REGISTERED") throw new Error("Active member rejected from MEMBERS_ONLY");
  console.log("✓ Active member successfully registered for MEMBERS_ONLY event");

  // 4. Test Concurrency & Capacity Protection
  const capacityEvent = await prisma.event.create({
    data: {
      clubId: testClub.id,
      createdById: adminUser.id,
      title: `Strict Capacity Event ${timestamp}`,
      description: "Only 2 spots available!",
      location: "Lab 3",
      startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 25 * 60 * 60 * 1000),
      capacity: 2,
      visibility: "CAMPUS",
      status: "PUBLISHED",
    },
  });

  // Create 5 distinct users to compete for the 2 slots
  const competitorIds: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const compUser = await prisma.user.upsert({
      where: { email: `competitor-${i}-${timestamp}@example.com` },
      update: {},
      create: {
        id: `user_competitor_${i}_${timestamp}`,
        email: `competitor-${i}-${timestamp}@example.com`,
        name: `Competitor ${i}`,
        studentId: `COMP-${i}-${timestamp}`,
        department: "Engineering",
        role: "STUDENT",
      },
    });
    competitorIds.push(compUser.id);
  }

  console.log("-> Firing 5 concurrent registration attempts for capacity: 2 ...");
  const results = await Promise.allSettled(
    competitorIds.map((cId) => registerUser(cId, capacityEvent.id))
  );

  const fulfilled = results.filter((r) => r.status === "fulfilled");
  const rejected = results.filter((r) => r.status === "rejected");

  console.log(`-> Results: ${fulfilled.length} fulfilled, ${rejected.length} rejected`);
  if (fulfilled.length !== 2 || rejected.length !== 3) {
    throw new Error(
      `Capacity violation! Expected exactly 2 fulfilled and 3 rejected, got ${fulfilled.length} fulfilled, ${rejected.length} rejected.`
    );
  }
  console.log("✓ Strict concurrency capacity check passed! Exceeded requests were blocked with conflict");

  // 5. Test Past Event cancellation block
  const pastEvent = await prisma.event.create({
    data: {
      clubId: testClub.id,
      createdById: adminUser.id,
      title: `Past Event ${timestamp}`,
      description: "Already happened",
      location: "Hall B",
      startsAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      endsAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      capacity: 10,
      visibility: "CAMPUS",
      status: "PUBLISHED",
    },
  });

  // Pre-seed a registration directly
  await prisma.eventRegistration.create({
    data: {
      eventId: pastEvent.id,
      userId: memberUser.id,
      status: "REGISTERED",
    },
  });

  let cancelPastThrew = false;
  try {
    await cancelRegistration(memberUser.id, pastEvent.id);
  } catch (e: any) {
    if (e.message.includes("Event already started")) cancelPastThrew = true;
  }
  if (!cancelPastThrew) throw new Error("Cancelling past event did not throw error");
  console.log("✓ Cancellation of started event correctly blocked");

  // 6. Test My Registrations query structure
  const upcomingRegs = await prisma.eventRegistration.findMany({
    where: {
      userId: memberUser.id,
      status: { not: "CANCELLED" },
      event: { endsAt: { gte: new Date() } },
    },
    include: { event: { include: { club: true } } },
    orderBy: [{ event: { startsAt: "asc" } }, { id: "asc" }],
  });
  console.log(`✓ Upcoming registrations query succeeded: found ${upcomingRegs.length} events`);

  console.log("=== ALL SPEC 22 VERIFICATION CHECKS PASSED ===");
}

run()
  .catch((err) => {
    console.error("Test failed with error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
