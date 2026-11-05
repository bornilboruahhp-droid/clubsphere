import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/get-current-user";
import { requireClubManager } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { EventForm } from "@/components/events/event-form";

export const metadata: Metadata = {
  title: "Edit Event | ClubSphere",
  description: "Update event details, timing, or capacity.",
};

interface EditEventPageProps {
  params: Promise<{
    clubId: string;
    eventId: string;
  }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const user = await requireUser();
  const { clubId, eventId } = await params;

  // Authorization: Manager or platform Admin only
  await requireClubManager(user, clubId);

  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      clubId,
    },
    include: {
      club: {
        select: { id: true, name: true, status: true },
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

  if (!event || event.club.status !== "ACTIVE") {
    notFound();
  }

  // Editing is restricted to DRAFT or PUBLISHED events
  if (event.status !== "DRAFT" && event.status !== "PUBLISHED") {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit Event — ${event.title}`}
        description={`Modify scheduling, capacity, and details for ${event.club.name}.`}
      />

      <EventForm
        clubId={clubId}
        initialData={event}
        activeRegistrationsCount={event._count.registrations}
      />
    </div>
  );
}
