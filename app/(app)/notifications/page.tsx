import { Metadata } from "next";
import { requireUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { NotificationsView } from "@/components/notifications/notifications-view";

export const metadata: Metadata = {
  title: "Notifications | ClubSphere",
  description: "View and manage your platform and club notifications",
};

export default async function NotificationsPage() {
  const user = await requireUser();

  const notifications = await prisma.notification.findMany({
    where: {
      userId: user.id,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 100,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      href: true,
      readAt: true,
      createdAt: true,
    },
  });

  const serialized = notifications.map((n) => ({
    ...n,
    readAt: n.readAt ? n.readAt.toISOString() : null,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Stay updated with announcements, club activities, and deadlines"
      />
      <NotificationsView initialNotifications={serialized} />
    </div>
  );
}
