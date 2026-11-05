import { Metadata } from "next";
import Link from "next/link";
import { Calendar, CheckCircle2, History, ArrowRight, MapPin, Users } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/get-current-user";
import {
  getDiscoveryEvents,
  getMyRegisteredEvents,
  DiscoveryEventItem,
} from "@/lib/data/events";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { EventCard } from "@/components/events/event-card";
import { EventSearchFilters } from "@/components/events/event-search-filters";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Events & Activities | ClubSphere",
  description:
    "Discover upcoming campus workshops, speaker sessions, hackathons, and student gatherings.",
};

interface EventsPageProps {
  searchParams: Promise<{
    tab?: string;
    q?: string;
    clubId?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const user = await requireUser();
  const params = await searchParams;

  const defaultTab = params.tab === "registrations" ? "registrations" : "upcoming";

  const [clubs, events, { upcoming: myUpcoming, past: myPast }] =
    await Promise.all([
      prisma.club.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      getDiscoveryEvents(user.id, {
        q: params.q,
        clubId: params.clubId,
        from: params.from,
        to: params.to,
      }),
      getMyRegisteredEvents(user.id),
    ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Events & Activities"
        description="Discover upcoming workshops, guest lectures, hackathons, and gatherings across campus organizations."
      />

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="bg-surface border border-surface-border p-1 rounded-xl h-auto">
          <TabsTrigger
            value="upcoming"
            className="data-[state=active]:bg-subtle data-[state=active]:text-copy-primary rounded-lg px-4 py-2 text-xs sm:text-sm font-medium gap-2"
          >
            <Calendar className="size-4" />
            Upcoming Events
            <Badge
              variant="secondary"
              className="ml-1 text-[11px] px-1.5 py-0 bg-surface-border text-copy-secondary"
            >
              {events.length}
            </Badge>
          </TabsTrigger>

          <TabsTrigger
            value="registrations"
            className="data-[state=active]:bg-subtle data-[state=active]:text-copy-primary rounded-lg px-4 py-2 text-xs sm:text-sm font-medium gap-2"
          >
            <CheckCircle2 className="size-4" />
            My Registrations
            <Badge
              variant="secondary"
              className="ml-1 text-[11px] px-1.5 py-0 bg-surface-border text-copy-secondary"
            >
              {myUpcoming.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Discover / Upcoming Events */}
        <TabsContent value="upcoming" className="space-y-6 outline-none">
          <EventSearchFilters
            clubs={clubs}
            currentQuery={params.q}
            currentClubId={params.clubId}
            currentFrom={params.from}
            currentTo={params.to}
          />

          {events.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No events found"
              description="No upcoming events match your filter criteria. Try searching with different terms or reset your filters."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: My Registrations */}
        <TabsContent value="registrations" className="space-y-8 outline-none">
          {myUpcoming.length === 0 && myPast.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No registrations yet"
              description="You have not registered for any events yet. Check out the upcoming events feed and reserve your spot!"
            />
          ) : (
            <>
              {/* Upcoming Registrations */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-copy-primary">
                  <Calendar className="size-4 text-brand" />
                  Upcoming Reservations ({myUpcoming.length})
                </div>

                {myUpcoming.length === 0 ? (
                  <div className="rounded-xl border border-surface-border bg-surface p-6 text-center text-xs text-copy-muted">
                    No upcoming reservations. Browse the upcoming events tab to join sessions!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {myUpcoming.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-surface-border bg-surface p-5 shadow-xs space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-brand truncate">
                              {item.event.club.name}
                            </span>
                            <Badge
                              variant="outline"
                              className="bg-state-success-dim text-state-success border-state-success/30 text-[11px] font-semibold"
                            >
                              Reserved
                            </Badge>
                          </div>

                          <h4 className="text-base font-semibold text-copy-primary">
                            <Link
                              href={`/events/${item.event.id}`}
                              className="hover:underline"
                            >
                              {item.event.title}
                            </Link>
                          </h4>

                          <div className="space-y-1 text-xs text-copy-muted pt-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="size-3.5 shrink-0" />
                              <span>{formatDateTime(item.event.startsAt)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="size-3.5 shrink-0" />
                              <span className="truncate">{item.event.location}</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-surface-border flex items-center justify-between">
                          <span className="text-[11px] text-copy-muted">
                            Registered on {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="text-xs border-surface-border"
                          >
                            <Link href={`/events/${item.event.id}`}>
                              Manage
                              <ArrowRight className="size-3 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Past Registrations */}
              {myPast.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-surface-border">
                  <div className="flex items-center gap-2 text-sm font-semibold text-copy-muted">
                    <History className="size-4" />
                    Past Events & History ({myPast.length})
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myPast.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-surface-border/70 bg-surface/50 p-4 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-copy-muted truncate">
                            {item.event.club.name}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              item.status === "CANCELLED"
                                ? "bg-state-error-dim text-state-error border-state-error/30"
                                : item.status === "PRESENT"
                                ? "bg-state-success-dim text-state-success border-state-success/30"
                                : "bg-subtle text-copy-muted border-surface-border"
                            }`}
                          >
                            {item.status}
                          </Badge>
                        </div>

                        <h5 className="font-semibold text-copy-primary truncate">
                          <Link
                            href={`/events/${item.event.id}`}
                            className="hover:underline"
                          >
                            {item.event.title}
                          </Link>
                        </h5>

                        <div className="text-[11px] text-copy-muted flex items-center gap-1.5">
                          <Calendar className="size-3 shrink-0" />
                          <span>{formatDateTime(item.event.startsAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
