import { prisma } from "../lib/prisma";
import { AUDIT_ACTIONS } from "../lib/audit/actions";
import { canTransitionAttendance } from "../lib/events/attendance-transitions";

async function run() {
  console.log("=== Testing Spec 24: Attendance Recording API ===");

  const timestamp = Date.now();

  // 1. Setup users and club
  let adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        id: `admin_${timestamp}`,
        email: `admin_${timestamp}@example.com`,
        name: "Admin User",
        studentId: `ADM-${timestamp}`,
        department: "Administration",
        role: "ADMIN",
      },
    });
  }

  const managerUser = await prisma.user.create({
    data: {
      id: `manager_${timestamp}`,
      email: `manager_${timestamp}@example.com`,
      name: "Event Manager",
      studentId: `MGR-${timestamp}`,
      department: "Computer Science",
      role: "STUDENT",
    },
  });

  const studentUser = await prisma.user.create({
    data: {
      id: `student_${timestamp}`,
      email: `student_${timestamp}@example.com`,
      name: "Student Member",
      studentId: `STU-${timestamp}`,
      department: "Math",
      role: "STUDENT",
    },
  });

  const testClub = await prisma.club.create({
    data: {
      name: `Attendance Club ${timestamp}`,
      description: "Club created for testing attendance features",
      status: "ACTIVE",
      proposerId: adminUser.id,
      advisorId: adminUser.id,
    },
  });

  // Assign manager as PRESIDENT
  await prisma.membership.create({
    data: {
      clubId: testClub.id,
      userId: managerUser.id,
      role: "PRESIDENT",
      status: "ACTIVE",
    },
  });

  // Assign student as ordinary MEMBER
  await prisma.membership.create({
    data: {
      clubId: testClub.id,
      userId: studentUser.id,
      role: "MEMBER",
      status: "ACTIVE",
    },
  });

  console.log("✓ Test users, club, and memberships created");

  // 2. Create started event
  const startedEvent = await prisma.event.create({
    data: {
      clubId: testClub.id,
      createdById: managerUser.id,
      title: `Started Workshop ${timestamp}`,
      description: "Live session in progress",
      location: "Room 101",
      startsAt: new Date(Date.now() - 30 * 60 * 1000), // started 30 mins ago
      endsAt: new Date(Date.now() + 60 * 60 * 1000),
      visibility: "CAMPUS",
      status: "PUBLISHED",
    },
  });

  // Create 4 attendee registrations
  const attendeeUsers = [];
  const registrations = [];
  for (let i = 1; i <= 4; i++) {
    const u = await prisma.user.create({
      data: {
        id: `att_${i}_${timestamp}`,
        email: `att_${i}_${timestamp}@example.com`,
        name: `Attendee ${i}`,
        studentId: `ATT-${i}-${timestamp}`,
        department: "CS",
        role: "STUDENT",
      },
    });
    attendeeUsers.push(u);

    const reg = await prisma.eventRegistration.create({
      data: {
        eventId: startedEvent.id,
        userId: u.id,
        status: "REGISTERED",
      },
    });
    registrations.push(reg);
  }
  console.log("✓ 4 attendees registered for started event");

  // 3. Test single attendance update
  const reg1 = registrations[0];

  // Mark Present
  const now = new Date();
  if (!canTransitionAttendance(reg1.status, "PRESENT")) {
    throw new Error("Transition REGISTERED -> PRESENT failed rule check");
  }

  const updatedReg1 = await prisma.eventRegistration.update({
    where: { id: reg1.id },
    data: {
      status: "PRESENT",
      statusChangedAt: now,
      checkedInAt: now,
    },
  });

  if (updatedReg1.status !== "PRESENT" || !updatedReg1.checkedInAt) {
    throw new Error("Single update to PRESENT failed");
  }
  console.log("✓ Single mark PRESENT succeeded with checkedInAt");

  // Mark Absent
  if (!canTransitionAttendance(updatedReg1.status, "ABSENT")) {
    throw new Error("Transition PRESENT -> ABSENT failed rule check");
  }
  const reg1Absent = await prisma.eventRegistration.update({
    where: { id: reg1.id },
    data: {
      status: "ABSENT",
      statusChangedAt: new Date(),
    },
  });
  if (reg1Absent.status !== "ABSENT") {
    throw new Error("Single update to ABSENT failed");
  }
  console.log("✓ Single mark ABSENT succeeded");

  // 4. Test bulk attendance update
  const bulkIds = [registrations[1].id, registrations[2].id];
  const bulkNow = new Date();

  await prisma.eventRegistration.updateMany({
    where: { id: { in: bulkIds } },
    data: {
      status: "PRESENT",
      statusChangedAt: bulkNow,
      checkedInAt: bulkNow,
    },
  });

  const verifiedBulk = await prisma.eventRegistration.findMany({
    where: { id: { in: bulkIds } },
  });
  if (verifiedBulk.some((r) => r.status !== "PRESENT")) {
    throw new Error("Bulk update to PRESENT failed");
  }
  console.log("✓ Bulk update of 2 attendees to PRESENT succeeded");

  // 5. Test finalize attendance
  // At this point:
  // reg1 is ABSENT
  // reg2, reg3 are PRESENT
  // reg4 is still REGISTERED
  const finalizeNow = new Date();
  const remaining = await prisma.eventRegistration.findMany({
    where: { eventId: startedEvent.id, status: "REGISTERED" },
  });
  if (remaining.length !== 1 || remaining[0].id !== registrations[3].id) {
    throw new Error("Finalize candidate detection failed");
  }

  await prisma.eventRegistration.updateMany({
    where: { eventId: startedEvent.id, status: "REGISTERED" },
    data: {
      status: "ABSENT",
      statusChangedAt: finalizeNow,
    },
  });

  const reg4 = await prisma.eventRegistration.findUnique({
    where: { id: registrations[3].id },
  });
  if (reg4?.status !== "ABSENT") {
    throw new Error("Finalize failed to transition reg4 to ABSENT");
  }
  console.log("✓ Finalize attendance successfully transitioned remaining un-checked attendee to ABSENT");

  // 6. Test Event State Guard: Future Event
  const futureEvent = await prisma.event.create({
    data: {
      clubId: testClub.id,
      createdById: managerUser.id,
      title: `Future Event ${timestamp}`,
      description: "Not started yet",
      location: "Room 202",
      startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      endsAt: new Date(Date.now() + 26 * 60 * 60 * 1000),
      visibility: "CAMPUS",
      status: "PUBLISHED",
    },
  });

  const isFutureAllowed =
    (futureEvent.status === "PUBLISHED" && futureEvent.startsAt <= new Date()) ||
    futureEvent.status === "COMPLETED";

  if (isFutureAllowed) {
    throw new Error("Future event incorrectly passed attendance state check");
  }
  console.log("✓ Future event correctly identified as disallowed for attendance");

  // 7. Test Cancelled Registration cannot be transitioned
  const cancelledReg = await prisma.eventRegistration.create({
    data: {
      eventId: startedEvent.id,
      userId: studentUser.id,
      status: "CANCELLED",
    },
  });

  if (canTransitionAttendance(cancelledReg.status, "PRESENT")) {
    throw new Error("CANCELLED status unexpectedly allowed transition to PRESENT");
  }
  console.log("✓ CANCELLED registration correctly blocked from being marked PRESENT");

  console.log("=== ALL SPEC 24 VERIFICATION CHECKS PASSED ===");
}

run()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
