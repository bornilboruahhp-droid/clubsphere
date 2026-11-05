import Link from "next/link";
import { Calendar, MapPin, Users, Check, Lock, ArrowRight } from "lucide-react";
import type { DiscoveryEventItem } from "@/lib/data/events";
import { formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface EventCardProps {
  event: DiscoveryEventItem;
}

export function EventCard({ event }: EventCardProps) {
  const isRegistered = event.myRegistration?.status === "REGISTERED";
  const isMembersOnly = event.visibility === "MEMBERS_ONLY";
  const isFull = event.capacity !== null && event.spotsRemaining === 0;

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-surface-border bg-surface p-5 sm:p-6 shadow-xs hover:border-brand/40 hover:shadow-md transition-all">
      <div className="space-y-3.5">
        {/* Header row: Club & Status badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            href={`/clubs/${event.clubId}`}
            className="text-xs font-semibold text-brand hover:underline truncate max-w-[200px]"
          >
            {event.club.name}
          </Link>

          <div className="flex items-center gap-1.5 flex-wrap">
            {isMembersOnly && (
              <Badge
                variant="outline"
                className="bg-state-warning-dim text-state-warning border-state-warning/30 text-[11px] font-semibold gap-1"
              >
                <Lock className="size-3" />
                Members Only
              </Badge>
            )}

            {isRegistered && (
              <Badge
                variant="outline"
                className="bg-state-success-dim text-state-success border-state-success/30 text-[11px] font-semibold gap-1"
              >
                <Check className="size-3" />
                Registered
              </Badge>
            )}

            {!isRegistered && isFull && (
              <Badge
                variant="outline"
                className="bg-subtle text-copy-muted border-surface-border text-[11px] font-medium"
              >
                Full
              </Badge>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-copy-primary line-clamp-2 group-hover:text-brand transition-colors">
            <Link href={`/events/${event.id}`} className="focus:outline-none">
              {event.title}
            </Link>
          </h3>
          <p className="text-xs text-copy-muted line-clamp-2 mt-1">
            {event.description}
          </p>
        </div>

        {/* Event Metadata */}
        <div className="space-y-1.5 pt-2 border-t border-surface-border/60 text-xs text-copy-secondary">
          <div className="flex items-center gap-2">
            <Calendar className="size-3.5 text-copy-muted shrink-0" />
            <span className="font-medium text-copy-primary">
              {formatDateTime(event.startsAt)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="size-3.5 text-copy-muted shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>

          <div className="flex items-center gap-2">
            <Users className="size-3.5 text-copy-muted shrink-0" />
            {event.capacity !== null ? (
              <span>
                {event.spotsRemaining !== null && event.spotsRemaining > 0 ? (
                  <strong className="text-state-success font-semibold">
                    {event.spotsRemaining} spots left
                  </strong>
                ) : (
                  <span className="text-copy-muted">At capacity ({event.capacity})</span>
                )}{" "}
                <span className="text-copy-muted">
                  ({event.activeRegistrationCount} / {event.capacity} registered)
                </span>
              </span>
            ) : (
              <span>
                {event.activeRegistrationCount} registered{" "}
                <span className="text-copy-muted">(Unlimited capacity)</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer / Link */}
      <div className="pt-4 mt-4 border-t border-surface-border flex items-center justify-between">
        <span className="text-xs text-copy-muted">
          {event.endsAt <= new Date() ? "Ended" : "Upcoming"}
        </span>

        <Button
          asChild
          variant="outline"
          size="sm"
          className="border-surface-border hover:bg-subtle text-xs gap-1 group-hover:border-brand/30"
        >
          <Link href={`/events/${event.id}`}>
            {isRegistered ? "View Reservation" : "Details & Register"}
            <ArrowRight className="size-3 text-copy-muted group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
