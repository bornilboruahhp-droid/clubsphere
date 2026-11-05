import Link from "next/link";
import { Users, ArrowRight, Building2, Calendar, MapPin, CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/auth/get-current-user";
import { getMyClubs } from "@/lib/data/clubs";
import { getDashboardUpcomingEvents } from "@/lib/data/events";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ClubRole } from "@prisma/client";

export default async function DashboardPage() {
  const user = await requireUser();
  const [allClubs, upcomingEvents] = await Promise.all([
    getMyClubs(user.id),
    getDashboardUpcomingEvents(user.id),
  ]);

  // Active clubs where the user holds an active membership
  const activeClubs = allClubs.filter(
    (club) => club.status === "ACTIVE" && club.myStatus === "ACTIVE"
  );

  const getRoleBadge = (role?: ClubRole) => {
    switch (role) {
      case "PRESIDENT":
        return (
          <Badge
            variant="outline"
            className="bg-brand/10 text-brand border-brand/20 font-semibold text-xs px-2.5 py-0.5 uppercase tracking-wider"
          >
            President
          </Badge>
        );
      case "SECRETARY":
        return (
          <Badge
            variant="outline"
            className="bg-state-info-dim text-state-info border-state-info/20 font-semibold text-xs px-2.5 py-0.5 uppercase tracking-wider"
          >
            Secretary
          </Badge>
        );
      case "TREASURER":
        return (
          <Badge
            variant="outline"
            className="bg-state-warning-dim text-state-warning border-state-warning/20 font-semibold text-xs px-2.5 py-0.5 uppercase tracking-wider"
          >
            Treasurer
          </Badge>
        );
      case "MEMBER":
      default:
        return (
          <Badge
            variant="outline"
            className="bg-subtle text-copy-secondary border-surface-border font-medium text-xs px-2.5 py-0.5"
          >
            Member
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Overview of your active club memberships, responsibilities, and campus activities."
      />

      {/* "My Clubs" Section */}
      <div className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
              <Users className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-copy-primary">
                My Clubs & Organizations
              </h2>
              <p className="text-xs text-copy-muted">
                Organizations where you hold an active leadership or membership role.
              </p>
            </div>
          </div>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-surface-border text-copy-primary hover:bg-subtle gap-1.5 self-start sm:self-auto"
          >
            <Link href="/clubs">
              Discover Clubs
              <ArrowRight className="size-3.5 text-copy-muted" />
            </Link>
          </Button>
        </div>

        {activeClubs.length === 0 ? (
          <div className="text-center py-10 px-4 space-y-3">
            <div className="size-12 rounded-full bg-subtle text-copy-muted flex items-center justify-center mx-auto">
              <Building2 className="size-6" />
            </div>
            <h3 className="text-sm font-semibold text-copy-primary">
              Not a member of any clubs yet
            </h3>
            <p className="text-xs text-copy-muted max-w-sm mx-auto leading-relaxed">
              Explore the campus directory to join student organizations, discover upcoming events, and connect with faculty sponsors.
            </p>
            <div className="pt-2">
              <Button asChild size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90 font-medium">
                <Link href="/clubs">Explore Active Clubs</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeClubs.map((club) => (
              <Link
                key={club.id}
                href={`/clubs/${club.id}`}
                className="group rounded-xl border border-surface-border bg-subtle/40 p-4 transition-all hover:border-brand/40 hover:bg-surface hover:shadow-xs flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-copy-primary group-hover:text-brand transition-colors line-clamp-1">
                      {club.name}
                    </h3>
                    {getRoleBadge(club.myRole || undefined)}
                  </div>
                  <p className="text-xs text-copy-secondary line-clamp-2 leading-relaxed">
                    {club.description}
                  </p>
                </div>

                  <div className="pt-2 border-t border-surface-border/60 flex items-center justify-between text-xs text-copy-muted">
                    <span className="truncate">
                      Advisor: <strong className="text-copy-secondary">{club.advisor.name}</strong>
                    </span>
                    <span className="text-brand font-medium text-[11px] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 shrink-0">
                      View
                      <ArrowRight className="size-3" />
                    </span>
                  </div>
                </Link>
            ))}
          </div>
        )}
      </div>

      {/* "Upcoming Events" Section */}
      <div className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
              <Calendar className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-copy-primary">
                Upcoming Events & Activities
              </h2>
              <p className="text-xs text-copy-muted">
                Your reservations and sessions hosted by your clubs.
              </p>
            </div>
          </div>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-surface-border text-copy-primary hover:bg-subtle gap-1.5 self-start sm:self-auto"
          >
            <Link href="/events">
              View All Events
              <ArrowRight className="size-3.5 text-copy-muted" />
            </Link>
          </Button>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="text-center py-10 px-4 space-y-3">
            <div className="size-12 rounded-full bg-subtle text-copy-muted flex items-center justify-center mx-auto">
              <Calendar className="size-6" />
            </div>
            <h3 className="text-sm font-semibold text-copy-primary">
              No upcoming events on your schedule
            </h3>
            <p className="text-xs text-copy-muted max-w-sm mx-auto leading-relaxed">
              Check out the campus event feed to discover upcoming workshops, speaker panels, and meetings.
            </p>
            <div className="pt-2">
              <Button
                asChild
                size="sm"
                className="bg-brand text-brand-foreground hover:bg-brand/90 font-medium"
              >
                <Link href="/events">Browse Campus Events</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {upcomingEvents.map((evt) => (
              <Link
                key={evt.id}
                href={`/events/${evt.id}`}
                className="group rounded-xl border border-surface-border bg-subtle/40 p-4 transition-all hover:border-brand/40 hover:bg-surface hover:shadow-xs flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-brand truncate max-w-[140px]">
                      {evt.clubName}
                    </span>
                    {evt.isRegistered && (
                      <Badge
                        variant="outline"
                        className="bg-state-success-dim text-state-success border-state-success/30 text-[10px] font-semibold gap-1 px-1.5 py-0"
                      >
                        <CheckCircle2 className="size-3" />
                        Registered
                      </Badge>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-copy-primary group-hover:text-brand transition-colors line-clamp-1">
                    {evt.title}
                  </h4>

                  <div className="space-y-1 text-xs text-copy-muted pt-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="size-3 shrink-0" />
                      <span className="truncate">{formatDateTime(evt.startsAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="size-3 shrink-0" />
                      <span className="truncate">{evt.location}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-surface-border/60 flex items-center justify-between text-[11px] text-copy-muted">
                  <span>View Details</span>
                  <ArrowRight className="size-3 text-brand group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
