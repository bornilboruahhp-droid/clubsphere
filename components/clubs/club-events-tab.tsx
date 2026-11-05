"use client";

import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  ArrowRight,
  Eye,
  Settings,
} from "lucide-react";
import type { ClubEventItem } from "@/lib/data/events";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/layout/empty-state";
import { EventStatusBadge } from "@/components/events/event-status-badge";

interface ClubEventsTabProps {
  clubId: string;
  events: ClubEventItem[];
  isManager: boolean;
}

export function ClubEventsTab({
  clubId,
  events,
  isManager,
}: ClubEventsTabProps) {
  const now = new Date();

  // Upcoming: startsAt in future (or currently ongoing), sorted ascending
  const upcomingEvents = events
    .filter((e) => new Date(e.endsAt) >= now)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  // Past: endsAt has passed, sorted descending
  const pastEvents = events
    .filter((e) => new Date(e.endsAt) < now)
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());

  const renderEventCard = (event: ClubEventItem) => (
    <div
      key={event.id}
      className="rounded-2xl border border-surface-border bg-surface p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-4 transition-all hover:border-brand/40"
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <h3 className="text-base font-semibold text-copy-primary line-clamp-1">
              {event.title}
            </h3>
            <p className="text-xs text-copy-secondary line-clamp-2 leading-relaxed">
              {event.description}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <EventStatusBadge status={event.status} />
            <Badge
              variant="outline"
              className="text-[10px] px-2 py-0 border-surface-border text-copy-muted shrink-0"
            >
              <Eye className="size-2.5 mr-1" />
              {event.visibility === "CAMPUS" ? "Campus" : "Members"}
            </Badge>
          </div>
        </div>

        <div className="pt-2 border-t border-surface-border/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-copy-muted">
          <div className="flex items-center gap-1.5">
            <Calendar className="size-3.5 text-brand shrink-0" />
            <span className="truncate">{formatDateTime(event.startsAt)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="size-3.5 text-copy-muted shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-surface-border/60 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-copy-secondary font-medium">
          <Users className="size-3.5 text-brand" />
          {event.activeRegistrationCount}{" "}
          {event.capacity ? `/ ${event.capacity} registered` : "registered"}
        </span>

        {isManager ? (
          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-8 text-xs border-surface-border text-copy-primary hover:bg-subtle gap-1.5 font-medium"
          >
            <Link href={`/clubs/${clubId}/events/${event.id}`}>
              <Settings className="size-3 text-copy-muted" />
              Manage Event
            </Link>
          </Button>
        ) : (
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="h-8 text-xs text-brand hover:text-brand hover:bg-brand/10 gap-1 font-medium"
          >
            <Link href={`/events/${event.id}`}>
              View Event
              <ArrowRight className="size-3" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h2 className="text-lg font-semibold text-copy-primary">
            Club Events & Activities
          </h2>
          <p className="text-xs text-copy-muted">
            Workshops, speaker series, and official student gatherings.
          </p>
        </div>

        {isManager && (
          <Button
            asChild
            size="sm"
            className="h-9 gap-1.5 bg-brand text-brand-foreground hover:bg-brand/90 font-medium shadow-xs self-start sm:self-auto"
          >
            <Link href={`/clubs/${clubId}/events/new`}>
              <Plus className="size-4" />
              New Event
            </Link>
          </Button>
        )}
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No events scheduled"
          description={
            isManager
              ? "Get started by planning and scheduling your first club event."
              : "This club has not published upcoming events yet."
          }
        />
      ) : (
        <div className="space-y-8">
          {/* Section 1: Upcoming Events */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-brand" />
              <h3 className="text-sm font-semibold text-copy-primary uppercase tracking-wider">
                Upcoming & Ongoing ({upcomingEvents.length})
              </h3>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="rounded-xl border border-surface-border/60 bg-subtle/30 p-6 text-center text-xs text-copy-muted">
                No upcoming events scheduled right now.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingEvents.map(renderEventCard)}
              </div>
            )}
          </div>

          {/* Section 2: Past Events */}
          {pastEvents.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-surface-border">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-copy-muted" />
                <h3 className="text-sm font-semibold text-copy-muted uppercase tracking-wider">
                  Past Events ({pastEvents.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pastEvents.map(renderEventCard)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
