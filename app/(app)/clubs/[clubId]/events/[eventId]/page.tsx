import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Eye,
  ArrowLeft,
  UserCheck,
  Building2,
} from "lucide-react";
import { requireUser } from "@/lib/auth/get-current-user";
import { requireClubManager } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { getEventManagementDetail } from "@/lib/data/events";
import { formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EventStatusBadge } from "@/components/events/event-status-badge";
import { EventStatusActions } from "@/components/events/event-status-actions";
import { EventAttendanceManager } from "@/components/events/event-attendance-manager";
import { EventQrDialog } from "@/components/events/event-qr-dialog";

export interface EventManagePageProps {
  params: Promise<{
    clubId: string;
    eventId: string;
  }>;
}

export async function generateMetadata({
  params,
}: EventManagePageProps): Promise<Metadata> {
  const { clubId, eventId } = await params;
  const event = await getEventManagementDetail(eventId, clubId);

  if (!event) {
    return { title: "Event Not Found | ClubSphere" };
  }

  return {
    title: `Manage: ${event.title} | ClubSphere`,
    description: event.description.slice(0, 160),
  };
}

export default async function EventManagePage({ params }: EventManagePageProps) {
  const user = await requireUser();
  const { clubId, eventId } = await params;

  // Authorization: Manager or platform Admin only
  await requireClubManager(user, clubId);

  const event = await getEventManagementDetail(eventId, clubId);
  if (!event) {
    notFound();
  }

  const attendees = await prisma.eventRegistration.findMany({
    where: { eventId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          studentId: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const capacityPercentage = event.capacity
    ? Math.min(Math.round((event.activeRegistrationCount / event.capacity) * 100), 100)
    : null;

  return (
    <div className="space-y-8">
      {/* Top Navigation & Status Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-6 border-b border-surface-border">
        <div className="space-y-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-copy-muted hover:text-copy-primary hover:bg-subtle -ml-2.5 h-8 gap-1.5"
          >
            <Link href={`/clubs/${clubId}?tab=events`}>
              <ArrowLeft className="size-3.5" />
              Back to {event.club.name}
            </Link>
          </Button>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-copy-primary">
              {event.title}
            </h1>
            <EventStatusBadge status={event.status} />
            <Badge
              variant="outline"
              className="text-xs px-2.5 py-0.5 border-surface-border text-copy-secondary"
            >
              <Eye className="size-3 mr-1 text-copy-muted" />
              {event.visibility === "CAMPUS" ? "Campus Open" : "Members Only"}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {event.status === "PUBLISHED" && (
            <EventQrDialog
              eventId={event.id}
              eventTitle={event.title}
            />
          )}

          <EventStatusActions
            eventId={event.id}
            clubId={clubId}
            status={event.status}
            startsAt={event.startsAt}
            registrationCount={event.activeRegistrationCount}
          />
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Schedule, Description, Capacity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-7 shadow-xs space-y-5">
            <h3 className="text-base font-semibold text-copy-primary">
              Event Overview
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-copy-secondary">
              <div className="rounded-xl border border-surface-border/70 bg-subtle/40 p-3.5 space-y-1">
                <span className="text-[11px] font-semibold text-copy-muted uppercase tracking-wider block">
                  Start Date & Time
                </span>
                <span className="font-medium text-copy-primary text-sm flex items-center gap-1.5">
                  <Calendar className="size-4 text-brand" />
                  {formatDateTime(event.startsAt)}
                </span>
              </div>

              <div className="rounded-xl border border-surface-border/70 bg-subtle/40 p-3.5 space-y-1">
                <span className="text-[11px] font-semibold text-copy-muted uppercase tracking-wider block">
                  End Date & Time
                </span>
                <span className="font-medium text-copy-primary text-sm flex items-center gap-1.5">
                  <Clock className="size-4 text-brand" />
                  {formatDateTime(event.endsAt)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-copy-muted uppercase tracking-wider block">
                Venue Location
              </span>
              <p className="text-sm text-copy-primary font-medium flex items-center gap-1.5">
                <MapPin className="size-4 text-brand shrink-0" />
                {event.location}
              </p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-surface-border/60">
              <span className="text-xs font-semibold text-copy-muted uppercase tracking-wider block">
                Description
              </span>
              <p className="text-sm text-copy-secondary leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>
          </div>

          {/* Attendance Management */}
          <EventAttendanceManager
            eventId={event.id}
            clubId={clubId}
            eventStatus={event.status}
            startsAt={event.startsAt}
            initialAttendees={attendees}
          />
        </div>

        {/* Right 1 Col: Capacity & Organization Sidebar */}
        <div className="space-y-6">
          {/* Capacity Progress Card */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6 shadow-xs space-y-4">
            <h4 className="text-sm font-semibold text-copy-primary flex items-center gap-2">
              <Users className="size-4 text-brand" />
              Capacity & RSVPs
            </h4>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-copy-primary">
                  {event.activeRegistrationCount}
                </span>
                <span className="text-xs text-copy-muted font-mono">
                  {event.capacity ? `/ ${event.capacity} seats` : "Unlimited"}
                </span>
              </div>

              {event.capacity && (
                <>
                  <div className="h-2 w-full rounded-full bg-subtle overflow-hidden">
                    <div
                      className="h-full bg-brand transition-all"
                      style={{ width: `${capacityPercentage}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-copy-muted text-right font-mono">
                    {capacityPercentage}% filled
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Host Club Card */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-copy-muted">
              <Building2 className="size-4 text-brand" />
              Organizing Club
            </div>
            <div>
              <h4 className="text-sm font-semibold text-copy-primary">
                {event.club.name}
              </h4>
              <p className="text-xs text-copy-muted mt-1">
                Created by {event.createdBy.name}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
