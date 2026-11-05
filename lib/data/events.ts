import { prisma } from "@/lib/prisma";
import type {
  EventStatus,
  EventVisibility,
  AttendanceStatus,
  Prisma,
} from "@prisma/client";

export interface ClubEventItem {
  id: string;
  clubId: string;
  title: string;
  description: string;
  location: string;
  startsAt: Date;
  endsAt: Date;
  capacity: number | null;
  visibility: EventVisibility;
  status: EventStatus;
  createdAt: Date;
  activeRegistrationCount: number;
}

export interface EventManagementDetailData extends ClubEventItem {
  club: {
    id: string;
    name: string;
    status: string;
    advisorId: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface DiscoveryEventItem {
  id: string;
  clubId: string;
  title: string;
  description: string;
  location: string;
  startsAt: Date;
  endsAt: Date;
  capacity: number | null;
  visibility: EventVisibility;
  status: EventStatus;
  club: {
    id: string;
    name: string;
  };
  activeRegistrationCount: number;
  spotsRemaining: number | null;
  myRegistration: {
    id: string;
    status: AttendanceStatus;
  } | null;
  isClubMember: boolean;
}

export interface RegisteredEventItem {
  id: string;
  status: AttendanceStatus;
  statusChangedAt: Date;
  checkedInAt: Date | null;
  createdAt: Date;
  event: {
    id: string;
    clubId: string;
    title: string;
    description: string;
    location: string;
    startsAt: Date;
    endsAt: Date;
    capacity: number | null;
    visibility: EventVisibility;
    status: EventStatus;
    activeRegistrationCount: number;
    club: {
      id: string;
      name: string;
    };
  };
}

export interface PublicEventDetailData {
  id: string;
  clubId: string;
  title: string;
  description: string;
  location: string;
  startsAt: Date;
  endsAt: Date;
  capacity: number | null;
  visibility: EventVisibility;
  status: EventStatus;
  club: {
    id: string;
    name: string;
    description?: string;
  };
  activeRegistrationCount: number;
  spotsRemaining: number | null;
  isClubMember: boolean;
  myRegistration: {
    id: string;
    status: AttendanceStatus;
  } | null;
}

export interface DashboardEventItem {
  id: string;
  title: string;
  location: string;
  startsAt: Date;
  endsAt: Date;
  clubName: string;
  clubId: string;
  isRegistered: boolean;
}

/**
 * Fetches events for a club with appropriate role-based visibility and registration count.
 */
export async function getClubEvents(
  clubId: string,
  userId: string,
  isManager: boolean,
  isActiveMember: boolean
): Promise<ClubEventItem[]> {
  const whereClause: any = { clubId };

  if (!isManager) {
    whereClause.status = { not: "DRAFT" };
    if (!isActiveMember) {
      whereClause.visibility = "CAMPUS";
    }
  }

  const events = await prisma.event.findMany({
    where: whereClause,
    include: {
      _count: {
        select: {
          registrations: {
            where: {
              status: { not: "CANCELLED" },
            },
          },
        },
      },
    },
    orderBy: {
      startsAt: "desc",
    },
  });

  return events.map((e) => ({
    id: e.id,
    clubId: e.clubId,
    title: e.title,
    description: e.description,
    location: e.location,
    startsAt: e.startsAt,
    endsAt: e.endsAt,
    capacity: e.capacity,
    visibility: e.visibility,
    status: e.status,
    createdAt: e.createdAt,
    activeRegistrationCount: e._count.registrations,
  }));
}

/**
 * Fetches event detail for club manager management dashboard.
 */
export async function getEventManagementDetail(
  eventId: string,
  clubId: string
): Promise<EventManagementDetailData | null> {
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      clubId,
    },
    include: {
      club: {
        select: {
          id: true,
          name: true,
          status: true,
          advisorId: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          registrations: {
            where: {
              status: { not: "CANCELLED" },
            },
          },
        },
      },
    },
  });

  if (!event) return null;

  return {
    id: event.id,
    clubId: event.clubId,
    title: event.title,
    description: event.description,
    location: event.location,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    capacity: event.capacity,
    visibility: event.visibility,
    status: event.status,
    createdAt: event.createdAt,
    activeRegistrationCount: event._count.registrations,
    club: event.club,
    createdBy: event.createdBy,
  };
}

/**
 * Fetches discovery events for the campus feed with filters and viewer registration state.
 */
export async function getDiscoveryEvents(
  userId: string,
  filters?: {
    q?: string;
    clubId?: string;
    from?: string;
    to?: string;
  }
): Promise<DiscoveryEventItem[]> {
  const [user, memberships] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    }),
    prisma.membership.findMany({
      where: { userId, status: "ACTIVE" },
      select: { clubId: true },
    }),
  ]);

  const isAdmin = user?.role === "ADMIN";
  const memberClubIds = new Set(memberships.map((m) => m.clubId));
  const now = new Date();

  const whereClause: Prisma.EventWhereInput = {
    status: "PUBLISHED",
  };

  if (filters?.from) {
    whereClause.startsAt = { gte: new Date(filters.from) };
  } else {
    // Upcoming events by default
    whereClause.endsAt = { gte: now };
  }

  if (filters?.to) {
    whereClause.endsAt = {
      ...(whereClause.endsAt ? (whereClause.endsAt as Prisma.DateTimeFilter) : {}),
      lte: new Date(filters.to),
    };
  }

  if (filters?.clubId) {
    whereClause.clubId = filters.clubId;
  }

  // Visibility: Admins see all; users see CAMPUS or MEMBERS_ONLY for their clubs
  if (!isAdmin) {
    whereClause.OR = [
      { visibility: "CAMPUS" },
      {
        visibility: "MEMBERS_ONLY",
        clubId: { in: Array.from(memberClubIds) },
      },
    ];
  }

  // Text search
  if (filters?.q && filters.q.trim()) {
    const search = filters.q.trim();
    whereClause.AND = [
      {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { location: { contains: search, mode: "insensitive" } },
        ],
      },
    ];
  }

  const events = await prisma.event.findMany({
    where: whereClause,
    include: {
      club: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          registrations: {
            where: {
              status: { not: "CANCELLED" },
            },
          },
        },
      },
      registrations: {
        where: {
          userId,
        },
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: {
      startsAt: "asc",
    },
  });

  return events.map((e) => {
    const activeCount = e._count.registrations;
    const spotsRemaining =
      e.capacity !== null ? Math.max(0, e.capacity - activeCount) : null;
    const myReg = e.registrations[0] || null;

    return {
      id: e.id,
      clubId: e.clubId,
      title: e.title,
      description: e.description,
      location: e.location,
      startsAt: e.startsAt,
      endsAt: e.endsAt,
      capacity: e.capacity,
      visibility: e.visibility,
      status: e.status,
      club: e.club,
      activeRegistrationCount: activeCount,
      spotsRemaining,
      myRegistration: myReg,
      isClubMember: memberClubIds.has(e.clubId) || isAdmin,
    };
  });
}

/**
 * Fetches the user's registrations split into upcoming and past.
 */
export async function getMyRegisteredEvents(userId: string): Promise<{
  upcoming: RegisteredEventItem[];
  past: RegisteredEventItem[];
}> {
  const now = new Date();

  const registrations = await prisma.eventRegistration.findMany({
    where: { userId },
    include: {
      event: {
        include: {
          club: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              registrations: {
                where: {
                  status: { not: "CANCELLED" },
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      event: {
        startsAt: "asc",
      },
    },
  });

  const upcoming: RegisteredEventItem[] = [];
  const past: RegisteredEventItem[] = [];

  for (const reg of registrations) {
    const item: RegisteredEventItem = {
      id: reg.id,
      status: reg.status,
      statusChangedAt: reg.statusChangedAt,
      checkedInAt: reg.checkedInAt,
      createdAt: reg.createdAt,
      event: {
        id: reg.event.id,
        clubId: reg.event.clubId,
        title: reg.event.title,
        description: reg.event.description,
        location: reg.event.location,
        startsAt: reg.event.startsAt,
        endsAt: reg.event.endsAt,
        capacity: reg.event.capacity,
        visibility: reg.event.visibility,
        status: reg.event.status,
        activeRegistrationCount: reg.event._count.registrations,
        club: reg.event.club,
      },
    };

    if (reg.status !== "CANCELLED" && reg.event.endsAt >= now) {
      upcoming.push(item);
    } else {
      past.push(item);
    }
  }

  // Sort past newest first
  past.sort((a, b) => b.event.startsAt.getTime() - a.event.startsAt.getTime());

  return { upcoming, past };
}

/**
 * Fetches public event detail for student-facing event page.
 */
export async function getPublicEventDetail(
  eventId: string,
  userId: string
): Promise<PublicEventDetailData | null> {
  const [event, user] = await Promise.all([
    prisma.event.findUnique({
      where: { id: eventId },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        _count: {
          select: {
            registrations: {
              where: {
                status: { not: "CANCELLED" },
              },
            },
          },
        },
        registrations: {
          where: { userId },
          select: {
            id: true,
            status: true,
          },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    }),
  ]);

  if (!event) return null;

  const isAdmin = user?.role === "ADMIN";
  const isClubMember =
    isAdmin ||
    (await prisma.membership
      .findFirst({
        where: {
          clubId: event.clubId,
          userId,
          status: "ACTIVE",
        },
        select: { id: true },
      })
      .then((m) => Boolean(m)));

  // If DRAFT, only accessible if admin or manager
  if (event.status === "DRAFT" && !isAdmin && !isClubMember) {
    return null;
  }

  const activeCount = event._count.registrations;
  const spotsRemaining =
    event.capacity !== null ? Math.max(0, event.capacity - activeCount) : null;
  const myReg = event.registrations[0] || null;

  return {
    id: event.id,
    clubId: event.clubId,
    title: event.title,
    description: event.description,
    location: event.location,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    capacity: event.capacity,
    visibility: event.visibility,
    status: event.status,
    club: event.club,
    activeRegistrationCount: activeCount,
    spotsRemaining,
    isClubMember,
    myRegistration: myReg,
  };
}

/**
 * Fetches upcoming events for the student dashboard.
 */
export async function getDashboardUpcomingEvents(
  userId: string
): Promise<DashboardEventItem[]> {
  const now = new Date();

  // 1. Registered events
  const registeredEvents = await prisma.eventRegistration.findMany({
    where: {
      userId,
      status: "REGISTERED",
      event: {
        endsAt: { gte: now },
        status: "PUBLISHED",
      },
    },
    include: {
      event: {
        include: {
          club: { select: { id: true, name: true } },
        },
      },
    },
    take: 5,
  });

  // 2. Club events from active memberships
  const memberships = await prisma.membership.findMany({
    where: { userId, status: "ACTIVE" },
    select: { clubId: true },
  });
  const clubIds = memberships.map((m) => m.clubId);

  const clubEvents =
    clubIds.length > 0
      ? await prisma.event.findMany({
          where: {
            clubId: { in: clubIds },
            status: "PUBLISHED",
            endsAt: { gte: now },
          },
          include: {
            club: { select: { id: true, name: true } },
          },
          take: 5,
          orderBy: { startsAt: "asc" },
        })
      : [];

  const registeredEventIds = new Set(registeredEvents.map((r) => r.eventId));

  const itemsMap = new Map<string, DashboardEventItem>();

  for (const reg of registeredEvents) {
    itemsMap.set(reg.event.id, {
      id: reg.event.id,
      title: reg.event.title,
      location: reg.event.location,
      startsAt: reg.event.startsAt,
      endsAt: reg.event.endsAt,
      clubName: reg.event.club.name,
      clubId: reg.event.club.id,
      isRegistered: true,
    });
  }

  for (const e of clubEvents) {
    if (!itemsMap.has(e.id)) {
      itemsMap.set(e.id, {
        id: e.id,
        title: e.title,
        location: e.location,
        startsAt: e.startsAt,
        endsAt: e.endsAt,
        clubName: e.club.name,
        clubId: e.club.id,
        isRegistered: registeredEventIds.has(e.id),
      });
    }
  }

  const sorted = Array.from(itemsMap.values()).sort(
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime()
  );

  return sorted.slice(0, 4);
}
