import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Building2,
  ChevronLeft,
  Lock,
  Globe,
  CheckCircle2,
} from "lucide-react";

import { requireUser } from "@/lib/auth/get-current-user";
import { getPublicEventDetail } from "@/lib/data/events";
import { formatDateTime, formatDate } from "@/lib/format";
import { INSTITUTION_TIMEZONE } from "@/lib/config";
import { RegisterButton } from "@/components/events/register-button";
import { EventStatusBadge } from "@/components/events/event-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface EventDetailPageProps {
  params: Promise<{
    eventId: string;
  }>;
}

export async function generateMetadata({
  params,
}: EventDetailPageProps): Promise<Metadata> {
  const { eventId } = await params;
  const user = await requireUser();
  const event = await getPublicEventDetail(eventId, user.id);

  if (!event) {
    return { title: "Event Not Found | ClubSphere" };
  }

  return {
    title: `${event.title} | ClubSphere Events`,
    description: event.description.slice(0, 160),
  };
}

export default async function PublicEventDetailPage({
  params,
}: EventDetailPageProps) {
  const user = await requireUser();
  const { eventId } = await params;

  const event = await getPublicEventDetail(eventId, user.id);
  if (!event) {
    notFound();
  }

  const isMembersOnly = event.visibility === "MEMBERS_ONLY";
  const isRegistered = event.myRegistration?.status === "REGISTERED";
  const capacityPct =
    event.capacity !== null
      ? Math.min(100, Math.round((event.activeRegistrationCount / event.capacity) * 100))
      : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Back button */}
      <div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-xs text-copy-muted hover:text-copy-primary -ml-2 gap-1"
        >
          <Link href="/events">
            <ChevronLeft className="size-4" />
            Back to Events
          </Link>
        </Button>
      </div>

      {/* Main Grid: Details (Left) and Registration / Meta Card (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols): Event Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <EventStatusBadge status={event.status} />

              <Badge
                variant="outline"
                className={`text-xs gap-1 font-medium ${
                  isMembersOnly
                    ? "bg-state-warning-dim text-state-warning border-state-warning/30"
                    : "bg-subtle text-copy-secondary border-surface-border"
                }`}
              >
                {isMembersOnly ? (
                  <>
                    <Lock className="size-3" />
                    Members Only
                  </>
                ) : (
                  <>
                    <Globe className="size-3" />
                    Campus Wide
                  </>
                )}
              </Badge>

              {isRegistered && (
                <Badge
                  variant="outline"
                  className="bg-state-success-dim text-state-success border-state-success/30 text-xs font-semibold gap-1"
                >
                  <CheckCircle2 className="size-3" />
                  You are registered
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-copy-primary">
              {event.title}
            </h1>

            <div className="flex items-center gap-2 text-sm text-copy-muted">
              <span>Hosted by</span>
              <Link
                href={`/clubs/${event.clubId}`}
                className="font-semibold text-brand hover:underline inline-flex items-center gap-1.5"
              >
                <Building2 className="size-3.5" />
                {event.club.name}
              </Link>
            </div>
          </div>

          {/* Description Section */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-7 shadow-xs space-y-4">
            <h2 className="text-base font-semibold text-copy-primary">
              About This Event
            </h2>
            <div className="prose prose-sm text-copy-secondary max-w-none whitespace-pre-wrap leading-relaxed">
              {event.description}
            </div>
          </div>

          {/* Organization Bio Card */}
          <div className="rounded-2xl border border-surface-border bg-surface/60 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider font-semibold text-copy-muted">
                Organizer
              </span>
              <h3 className="text-base font-semibold text-copy-primary">
                {event.club.name}
              </h3>
              {event.club.description && (
                <p className="text-xs text-copy-muted line-clamp-2 max-w-lg">
                  {event.club.description}
                </p>
              )}
            </div>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-surface-border text-copy-primary hover:bg-subtle shrink-0"
            >
              <Link href={`/clubs/${event.clubId}`}>View Organization</Link>
            </Button>
          </div>
        </div>

        {/* Right Column (1 col): Action & Logistics Sidebar */}
        <div className="space-y-6">
          {/* Action Card */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6 shadow-xs space-y-6 sticky top-20">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-copy-muted uppercase tracking-wider">
                Registration
              </span>
              <h3 className="text-lg font-semibold text-copy-primary">
                Join Event
              </h3>
            </div>

            {/* Capacity Progress */}
            <div className="space-y-2 pt-2 border-t border-surface-border text-xs">
              <div className="flex items-center justify-between text-copy-muted">
                <span>Capacity</span>
                <span className="font-semibold text-copy-primary">
                  {event.capacity !== null
                    ? `${event.activeRegistrationCount} / ${event.capacity}`
                    : `${event.activeRegistrationCount} registered`}
                </span>
              </div>

              {event.capacity !== null && (
                <div className="space-y-1.5">
                  <div className="w-full h-2 rounded-full bg-subtle overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        capacityPct >= 100
                          ? "bg-state-error"
                          : capacityPct >= 80
                          ? "bg-state-warning"
                          : "bg-brand"
                      }`}
                      style={{ width: `${capacityPct}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-copy-muted">
                      {event.spotsRemaining !== null && event.spotsRemaining > 0 ? (
                        <strong className="text-state-success font-medium">
                          {event.spotsRemaining} spots available
                        </strong>
                      ) : (
                        <span className="text-state-error font-medium">
                          Event at full capacity
                        </span>
                      )}
                    </span>
                    <span className="text-copy-muted">{capacityPct}% filled</span>
                  </div>
                </div>
              )}
            </div>

            {/* Register Action Button */}
            <div className="pt-2">
              <RegisterButton
                eventId={event.id}
                status={event.status}
                visibility={event.visibility}
                startsAt={event.startsAt}
                endsAt={event.endsAt}
                capacity={event.capacity}
                activeRegistrationCount={event.activeRegistrationCount}
                isClubMember={event.isClubMember}
                registration={event.myRegistration}
                size="lg"
                className="w-full"
              />
            </div>

            {/* Schedule & Logistics */}
            <div className="space-y-4 pt-4 border-t border-surface-border text-xs">
              <div className="flex items-start gap-3 text-copy-secondary">
                <Calendar className="size-4 text-brand mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <span className="font-semibold text-copy-primary block">
                    {formatDate(event.startsAt, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-copy-muted">
                    {formatDateTime(event.startsAt, {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}{" "}
                    –{" "}
                    {formatDateTime(event.endsAt, {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}{" "}
                    ({INSTITUTION_TIMEZONE})
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-copy-secondary">
                <MapPin className="size-4 text-brand mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <span className="font-semibold text-copy-primary block">
                    Location
                  </span>
                  <span className="text-copy-muted break-words">
                    {event.location}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
