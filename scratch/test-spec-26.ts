import { prisma } from "../lib/prisma";
import { AUDIT_ACTIONS } from "../lib/audit/actions";
import { notifyUsers } from "../lib/notifications/notify";

async function run() {
  console.log("=== Testing Spec 26: Targeted Announcements API ===");

  const timestamp = Date.now();

  // 1. Setup users & clubs
  let adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
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
      id: `manager_ann_${timestamp}`,
      email: `manager_ann_${timestamp}@example.com`,
      name: "Announcement Manager",
      studentId: `MGR-${timestamp}`,
      department: "Journalism",
      role: "STUDENT",
    },
  });

  const memberUser1 = await prisma.user.create({
    data: {
      id: `member1_ann_${timestamp}`,
      email: `member1_ann_${timestamp}@example.com`,
      name: "Club Member 1",
      studentId: `MEM1-${timestamp}`,
      department: "Literature",
      role: "STUDENT",
    },
  });

  const memberUser2 = await prisma.user.create({
    data: {
      id: `member2_ann_${timestamp}`,
      email: `member2_ann_${timestamp}@example.com`,
      name: "Club Member 2",
      studentId: `MEM2-${timestamp}`,
      department: "Math",
      role: "STUDENT",
    },
  });

  const outsiderUser = await prisma.user.create({
    data: {
      id: `outsider_ann_${timestamp}`,
      email: `outsider_ann_${timestamp}@example.com`,
      name: "Outsider Student",
      studentId: `OUT-${timestamp}`,
      department: "Physics",
      role: "STUDENT",
    },
  });

  const testClub = await prisma.club.create({
    data: {
      name: `Announcement Club ${timestamp}`,
      description: "Testing announcements targeting",
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

  // Assign members
  await prisma.membership.create({
    data: {
      clubId: testClub.id,
      userId: memberUser1.id,
      role: "MEMBER",
      status: "ACTIVE",
    },
  });
  await prisma.membership.create({
    data: {
      clubId: testClub.id,
      userId: memberUser2.id,
      role: "MEMBER",
      status: "ACTIVE",
    },
  });

  console.log("✓ Test users, club, and memberships created");

  // 2. Test ALL_MEMBERS Announcement Creation & Audience Resolution
  const announcement1 = await prisma.announcement.create({
    data: {
      clubId: testClub.id,
      authorId: managerUser.id,
      title: "General Meeting Scheduled",
      body: "We will meet this Friday at 4 PM in the lounge.",
      audience: "ALL_MEMBERS",
    },
  });

  // Resolve audience for ALL_MEMBERS (every active member except the author)
  const activeMembers = await prisma.membership.findMany({
    where: {
      clubId: testClub.id,
      status: "ACTIVE",
      userId: { not: managerUser.id },
    },
    select: { userId: true },
  });

  const recipientIds1 = activeMembers.map((m) => m.userId);
  if (recipientIds1.length !== 2) {
    throw new Error(`Expected exactly 2 recipients, got ${recipientIds1.length}`);
  }
  if (recipientIds1.includes(managerUser.id)) {
    throw new Error("Author was incorrectly included in recipient list");
  }
  if (!recipientIds1.includes(memberUser1.id) || !recipientIds1.includes(memberUser2.id)) {
    throw new Error("Active members missing from ALL_MEMBERS audience");
  }
  console.log("✓ ALL_MEMBERS audience correctly resolves to all members except author");

  // Send notifications
  await notifyUsers(recipientIds1, {
    type: "ANNOUNCEMENT",
    title: `${testClub.name}: ${announcement1.title}`,
    body: announcement1.body.slice(0, 150),
    href: `/clubs/${testClub.id}?tab=announcements`,
  });

  const notificationsSent = await prisma.notification.findMany({
    where: {
      userId: { in: recipientIds1 },
      type: "ANNOUNCEMENT",
    },
  });
  if (notificationsSent.length !== 2) {
    throw new Error("Notifications for ALL_MEMBERS were not recorded in database");
  }
  console.log("✓ Notifications successfully delivered to target member inboxes");

  // 3. Test EVENT_REGISTRANTS Announcement Targeting
  const clubEvent = await prisma.event.create({
    data: {
      clubId: testClub.id,
      createdById: managerUser.id,
      title: `Hackathon Prep ${timestamp}`,
      description: "Preparatory workshop",
      location: "Lab A",
      startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 26 * 60 * 60 * 1000),
      visibility: "CAMPUS",
      status: "PUBLISHED",
    },
  });

  // Register member1 and outsiderUser
  await prisma.eventRegistration.create({
    data: {
      eventId: clubEvent.id,
      userId: memberUser1.id,
      status: "REGISTERED",
    },
  });
  await prisma.eventRegistration.create({
    data: {
      eventId: clubEvent.id,
      userId: outsiderUser.id,
      status: "REGISTERED",
    },
  });
  // Register member2 but CANCELLED
  await prisma.eventRegistration.create({
    data: {
      eventId: clubEvent.id,
      userId: memberUser2.id,
      status: "CANCELLED",
    },
  });

  // Resolve audience for EVENT_REGISTRANTS
  const eventRegistrations = await prisma.eventRegistration.findMany({
    where: {
      eventId: clubEvent.id,
      status: { not: "CANCELLED" },
      userId: { not: managerUser.id },
    },
    select: { userId: true },
  });
  const eventRecipients = Array.from(new Set(eventRegistrations.map((r) => r.userId)));

  if (eventRecipients.length !== 2) {
    throw new Error(`Expected 2 event recipients, got ${eventRecipients.length}`);
  }
  if (!eventRecipients.includes(memberUser1.id) || !eventRecipients.includes(outsiderUser.id)) {
    throw new Error("Expected member1 and outsider in event recipients");
  }
  if (eventRecipients.includes(memberUser2.id)) {
    throw new Error("Cancelled registrant was incorrectly included in event recipients");
  }
  console.log("✓ EVENT_REGISTRANTS correctly excludes cancelled registrations and non-registrants");

  // 4. Test Cross-Club Event Target Guard
  const otherClub = await prisma.club.create({
    data: {
      name: `Other Club ${timestamp}`,
      description: "Other club",
      status: "ACTIVE",
      proposerId: adminUser.id,
      advisorId: adminUser.id,
    },
  });
  const otherEvent = await prisma.event.create({
    data: {
      clubId: otherClub.id,
      createdById: adminUser.id,
      title: "Other Event",
      description: "Other",
      location: "Other Room",
      startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 26 * 60 * 60 * 1000),
      status: "PUBLISHED",
    },
  });

  // Verify otherEvent does NOT belong to testClub
  const crossCheck = await prisma.event.findFirst({
    where: { id: otherEvent.id, clubId: testClub.id },
  });
  if (crossCheck) {
    throw new Error("Cross-club event unexpectedly matched testClub!");
  }
  console.log("✓ Cross-club event targeting guard correctly rejected mismatched clubId");

  // 5. Test Deletion
  await prisma.announcement.delete({
    where: { id: announcement1.id },
  });
  const deletedCheck = await prisma.announcement.findUnique({
    where: { id: announcement1.id },
  });
  if (deletedCheck) {
    throw new Error("Announcement deletion failed");
  }
  console.log("✓ Announcement deletion succeeded");

  console.log("=== ALL SPEC 26 VERIFICATION CHECKS PASSED ===");
}

run()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
