import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/get-current-user";
import { requireClubManager } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { EventForm } from "@/components/events/event-form";

export const metadata: Metadata = {
  title: "Create Event | ClubSphere",
  description: "Schedule a new event, workshop, or gathering for your organization.",
};

interface NewEventPageProps {
  params: Promise<{
    clubId: string;
  }>;
}

export default async function NewEventPage({ params }: NewEventPageProps) {
  const user = await requireUser();
  const { clubId } = await params;

  // Authorization: Manager or platform Admin only
  await requireClubManager(user, clubId);

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { id: true, name: true, status: true },
  });

  if (!club || club.status !== "ACTIVE") {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Create Event — ${club.name}`}
        description="Schedule a new gathering, workshop, or campus event. Events are initially saved in Draft status."
      />

      <EventForm clubId={club.id} />
    </div>
  );
}
