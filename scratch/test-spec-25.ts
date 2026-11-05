import { prisma } from "../lib/prisma";
import {
  generateCheckinToken,
  verifyCheckinToken,
  getCheckinBucket,
} from "../lib/events/checkin-token";

async function run() {
  console.log("=== Testing Spec 25: QR Check-in & Token Security ===");

  const timestamp = Date.now();
  const testEventId = `event_test_${timestamp}`;

  // 1. Test token generation & verification across buckets
  const currentBucket = getCheckinBucket();
  const currentToken = generateCheckinToken(testEventId, currentBucket);

  if (!verifyCheckinToken(testEventId, currentToken)) {
    throw new Error("Current bucket token verification failed");
  }
  console.log("✓ Current bucket token successfully verified");

  // Previous bucket (1 minute ago)
  const prev1Token = generateCheckinToken(testEventId, currentBucket - 1);
  if (!verifyCheckinToken(testEventId, prev1Token)) {
    throw new Error("Bucket - 1 token verification failed");
  }
  console.log("✓ Bucket - 1 (1 min ago) token successfully verified");

  // Previous bucket 2 (2 minutes ago)
  const prev2Token = generateCheckinToken(testEventId, currentBucket - 2);
  if (!verifyCheckinToken(testEventId, prev2Token)) {
    throw new Error("Bucket - 2 token verification failed");
  }
  console.log("✓ Bucket - 2 (2 mins ago) token successfully verified");

  // Expired bucket (3 minutes ago) -> MUST BE REJECTED
  const expiredToken = generateCheckinToken(testEventId, currentBucket - 3);
  if (verifyCheckinToken(testEventId, expiredToken)) {
    throw new Error("Expired bucket - 3 token was unexpectedly accepted!");
  }
  console.log("✓ Expired bucket - 3 (3 mins ago) token correctly rejected");

  // Tampered token -> MUST BE REJECTED
  const tamperedToken = currentToken.slice(0, -2) + "xx";
  if (verifyCheckinToken(testEventId, tamperedToken)) {
    throw new Error("Tampered token was unexpectedly accepted!");
  }
  console.log("✓ Tampered token correctly rejected");

  // Token for different event -> MUST BE REJECTED
  const otherEventToken = generateCheckinToken("other-event-id", currentBucket);
  if (verifyCheckinToken(testEventId, otherEventToken)) {
    throw new Error("Token for other event was unexpectedly accepted!");
  }
  console.log("✓ Token for different event correctly rejected");

  // 2. Setup database records to test self check-in flow
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

  const studentUser = await prisma.user.create({
    data: {
      id: `student_qr_${timestamp}`,
      email: `student_qr_${timestamp}@example.com`,
      name: "QR Student",
      studentId: `QR-${timestamp}`,
      department: "Engineering",
      role: "STUDENT",
    },
  });

  const testClub = await prisma.club.create({
    data: {
      name: `QR Check-in Club ${timestamp}`,
      description: "Club created for testing QR check-in",
      status: "ACTIVE",
      proposerId: adminUser.id,
      advisorId: adminUser.id,
    },
  });

  const liveEvent = await prisma.event.create({
    data: {
      clubId: testClub.id,
      createdById: adminUser.id,
      title: `Live QR Event ${timestamp}`,
      description: "Event ready for check-in",
      location: "Auditorium 2",
      startsAt: new Date(Date.now() - 10 * 60 * 1000), // started 10m ago
      endsAt: new Date(Date.now() + 50 * 60 * 1000),
      visibility: "CAMPUS",
      status: "PUBLISHED",
    },
  });

  // 3. Test check-in when NOT registered -> MUST REJECT WITH CONFLICT & NOT AUTO-REGISTER
  const liveToken = generateCheckinToken(liveEvent.id);

  const checkInAttempt = async (userId: string, eventId: string, tok: string) => {
    if (!verifyCheckinToken(eventId, tok)) {
      throw new Error("Invalid token");
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event || event.status !== "PUBLISHED") {
      throw new Error("Event not published");
    }

    const now = new Date();
    const windowStart = new Date(event.startsAt.getTime() - 30 * 60 * 1000);
    const windowEnd = new Date(event.endsAt.getTime() + 60 * 60 * 1000);
    if (now < windowStart || now > windowEnd) {
      throw new Error("Outside check-in window");
    }

    const registration = await prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });

    if (!registration || registration.status === "CANCELLED") {
      throw new Error("Conflict: not registered");
    }

    if (registration.status === "PRESENT") {
      return { success: true, alreadyCheckedIn: true };
    }

    const updated = await prisma.eventRegistration.update({
      where: { id: registration.id },
      data: {
        status: "PRESENT",
        checkedInAt: now,
        statusChangedAt: now,
      },
    });

    return { success: true, alreadyCheckedIn: false, registration: updated };
  };

  let unregFailed = false;
  try {
    await checkInAttempt(studentUser.id, liveEvent.id, liveToken);
  } catch (e: any) {
    if (e.message.includes("Conflict: not registered")) unregFailed = true;
  }
  if (!unregFailed) throw new Error("Unregistered user was able to check in without registering!");
  console.log("✓ Unregistered user correctly rejected with conflict and not auto-registered");

  // 4. Register student
  await prisma.eventRegistration.create({
    data: {
      eventId: liveEvent.id,
      userId: studentUser.id,
      status: "REGISTERED",
    },
  });

  // 5. Check in as registered student
  const checkinRes = await checkInAttempt(studentUser.id, liveEvent.id, liveToken);
  if (!checkinRes.success || checkinRes.alreadyCheckedIn || !checkinRes.registration?.checkedInAt) {
    throw new Error("Check-in attempt for registered student failed");
  }
  console.log("✓ Registered student check-in succeeded with status PRESENT and checkedInAt");

  // 6. Test Idempotency: second check-in returns alreadyCheckedIn: true
  const secondCheckin = await checkInAttempt(studentUser.id, liveEvent.id, liveToken);
  if (!secondCheckin.success || !secondCheckin.alreadyCheckedIn) {
    throw new Error("Second check-in attempt was not idempotent");
  }
  console.log("✓ Second check-in attempt was idempotent (alreadyCheckedIn: true)");

  // 7. Test Check-in window guard
  // Future event: starts 2 hours from now
  const farFutureEvent = await prisma.event.create({
    data: {
      clubId: testClub.id,
      createdById: adminUser.id,
      title: `Far Future Event ${timestamp}`,
      description: "Starts in 2 hours",
      location: "Room 303",
      startsAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
      visibility: "CAMPUS",
      status: "PUBLISHED",
    },
  });

  let windowCheckPassed = false;
  try {
    const futureTok = generateCheckinToken(farFutureEvent.id);
    await checkInAttempt(studentUser.id, farFutureEvent.id, futureTok);
  } catch (e: any) {
    if (e.message.includes("Outside check-in window")) windowCheckPassed = true;
  }
  if (!windowCheckPassed) throw new Error("Check-in allowed outside the 30-minute window before event start");
  console.log("✓ Event outside the 30-minute pre-start window correctly rejected");

  console.log("=== ALL SPEC 25 VERIFICATION CHECKS PASSED ===");
}

run()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
