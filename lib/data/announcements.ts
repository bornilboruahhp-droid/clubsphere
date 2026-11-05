import { prisma } from "@/lib/prisma";
import type { AnnouncementAudience } from "@prisma/client";

export interface ClubAnnouncementItem {
  id: string;
  clubId: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  eventId: string | null;
  createdAt: Date;
  author: {
    id: string;
    name: string;
    email: string;
  };
  event: {
    id: string;
    title: string;
  } | null;
}

/**
 * Preloads announcements for the club profile Announcements tab.
 */
export async function getClubAnnouncements(
  clubId: string
): Promise<ClubAnnouncementItem[]> {
  const announcements = await prisma.announcement.findMany({
    where: { clubId },
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      event: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  return announcements;
}
