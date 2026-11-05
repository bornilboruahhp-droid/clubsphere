import { Metadata } from "next";
import Link from "next/link";
import { Users, Plus, GraduationCap, ArrowRight, Compass, Shield } from "lucide-react";

import { requireUser } from "@/lib/auth/get-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getActiveClubs, getMyClubs } from "@/lib/data/clubs";
import { ClubSearchBar } from "@/components/clubs/club-search-bar";
import { StatusBadge } from "@/components/clubs/status-badge";

export const metadata: Metadata = {
  title: "Clubs Directory | ClubSphere",
  description: "Discover and participate in student-led organizations, chapters, and societies",
};

export interface ClubsPageProps {
  searchParams: Promise<{
    q?: string;
    tab?: string;
  }>;
}

export default async function ClubsPage({ searchParams }: ClubsPageProps) {
  const user = await requireUser();
  const { q, tab = "discover" } = await searchParams;

  const [activeClubs, myClubs] = await Promise.all([
    getActiveClubs(q),
    getMyClubs(user.id),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Clubs & Organizations"
        description="Explore student chapters, professional societies, and campus clubs, or charter your own."
        actions={
          <Button asChild className="rounded-xl bg-brand text-brand-foreground hover:bg-brand/90 font-medium">
            <Link href="/clubs/new">
              <Plus className="size-4 mr-1.5" />
              Register a club
            </Link>
          </Button>
        }
      />

      <Tabs defaultValue={tab} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
          <TabsList className="bg-subtle p-1 rounded-xl">
            <TabsTrigger
              value="discover"
              className="rounded-lg text-xs font-medium px-4 py-1.5 data-[state=active]:bg-surface data-[state=active]:text-copy-primary data-[state=active]:shadow-xs"
            >
              <Compass className="size-3.5 mr-1.5" />
              Discover
              <span className="ml-1.5 rounded-full bg-surface-border px-1.5 py-0.2 text-[10px] font-mono">
                {activeClubs.length}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="my-clubs"
              className="rounded-lg text-xs font-medium px-4 py-1.5 data-[state=active]:bg-surface data-[state=active]:text-copy-primary data-[state=active]:shadow-xs"
            >
              <Shield className="size-3.5 mr-1.5" />
              My Clubs
              <span className="ml-1.5 rounded-full bg-surface-border px-1.5 py-0.2 text-[10px] font-mono">
                {myClubs.length}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Search bar displayed on Discover tab */}
          <ClubSearchBar defaultValue={q} />
        </div>

        {/* Tab 1: Discover Active Clubs */}
        <TabsContent value="discover" className="space-y-6 outline-none">
          {activeClubs.length === 0 ? (
            <EmptyState
              icon={Users}
              title={q ? "No matching clubs found" : "No active clubs yet"}
              description={
                q
                  ? `No active student organizations match your search for "${q}". Try a different keyword or start a new club!`
                  : "Official student organizations will appear here once chartered and active."
              }
              action={
                <Button asChild variant="outline" className="rounded-xl border-surface-border">
                  <Link href="/clubs/new">
                    <Plus className="size-4 mr-1.5" />
                    Register a new club
                  </Link>
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeClubs.map((club) => (
                <Link
                  key={club.id}
                  href={`/clubs/${club.id}`}
                  className="group flex flex-col justify-between rounded-2xl border border-surface-border bg-surface p-6 shadow-xs hover:border-brand/40 hover:shadow-md transition-all duration-200"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-base text-copy-primary group-hover:text-brand transition-colors line-clamp-1">
                        {club.name}
                      </h3>
                      <StatusBadge status={club.status} />
                    </div>

                    <p className="text-xs text-copy-secondary line-clamp-3 leading-relaxed">
                      {club.description}
                    </p>
                  </div>

                  <div className="pt-5 mt-4 border-t border-surface-border flex items-center justify-between text-xs text-copy-muted">
                    <span className="flex items-center gap-1.5">
                      <Users className="size-3.5 text-brand" />
                      <strong>{club.activeMemberCount}</strong> {club.activeMemberCount === 1 ? "member" : "members"}
                    </span>

                    <span className="flex items-center gap-1 text-copy-primary font-medium group-hover:translate-x-0.5 transition-transform">
                      View
                      <ArrowRight className="size-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: My Clubs */}
        <TabsContent value="my-clubs" className="space-y-6 outline-none">
          {myClubs.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="You haven't joined any clubs"
              description="Explore active campus organizations on the Discover tab or register a new club charter proposal."
              action={
                <Button asChild className="rounded-xl bg-brand text-brand-foreground hover:bg-brand/90">
                  <Link href="/clubs/new">
                    <Plus className="size-4 mr-1.5" />
                    Start your first club
                  </Link>
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myClubs.map((club) => (
                <Link
                  key={club.id}
                  href={`/clubs/${club.id}`}
                  className="group flex flex-col justify-between rounded-2xl border border-surface-border bg-surface p-6 shadow-xs hover:border-brand/40 hover:shadow-md transition-all duration-200"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-base text-copy-primary group-hover:text-brand transition-colors line-clamp-1">
                        {club.name}
                      </h3>
                      <StatusBadge status={club.status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {club.myRole && (
                        <Badge
                          variant="secondary"
                          className="bg-brand/10 text-brand border-none text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5"
                        >
                          {club.myRole}
                        </Badge>
                      )}
                      {club.isProposer && !club.myRole && (
                        <Badge
                          variant="secondary"
                          className="bg-subtle text-copy-muted border-none text-[10px] font-medium px-2 py-0.5"
                        >
                          Proposer
                        </Badge>
                      )}
                      {club.myStatus && club.myStatus !== "ACTIVE" && (
                        <Badge
                          variant="outline"
                          className="border-surface-border text-copy-muted text-[10px] px-2 py-0.5"
                        >
                          {club.myStatus}
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-copy-secondary line-clamp-2 leading-relaxed">
                      {club.description}
                    </p>
                  </div>

                  <div className="pt-5 mt-4 border-t border-surface-border flex items-center justify-between text-xs text-copy-muted">
                    <span className="flex items-center gap-1.5">
                      <Users className="size-3.5 text-brand" />
                      <strong>{club.activeMemberCount}</strong> {club.activeMemberCount === 1 ? "member" : "members"}
                    </span>

                    <span className="flex items-center gap-1 text-copy-primary font-medium group-hover:translate-x-0.5 transition-transform">
                      Open
                      <ArrowRight className="size-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
