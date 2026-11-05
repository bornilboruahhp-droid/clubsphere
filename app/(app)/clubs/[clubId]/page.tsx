import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Users,
  Calendar,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Building2,
  AlertOctagon,
  Target,
  Vote,
  Megaphone,
  Settings,
  Mail,
  UserCheck,
  BarChart3,
  History,
} from "lucide-react";

import { requireUser, isProfileComplete } from "@/lib/auth/get-current-user";
import { getClubDetails } from "@/lib/data/clubs";
import { getClubRoster, getClubPendingRequests } from "@/lib/data/members";
import { getClubObjectives } from "@/lib/data/objectives";
import { getClubEvents } from "@/lib/data/events";
import { getClubAnnouncements } from "@/lib/data/announcements";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/clubs/status-badge";
import { ObjectiveStatusBadge } from "@/components/clubs/objective-status-badge";
import { ApprovalTimeline } from "@/components/clubs/approval-timeline";
import { ClubSettingsForm } from "@/components/clubs/club-settings-form";
import { JoinButton } from "@/components/clubs/join-button";
import { ClubMembersView } from "@/components/clubs/club-members-view";
import { ClubObjectivesView } from "@/components/clubs/club-objectives-view";
import { ClubEventsTab } from "@/components/clubs/club-events-tab";
import { ClubAnnouncementsTab } from "@/components/clubs/club-announcements-tab";
import { ClubElectionsComingSoon } from "@/components/clubs/club-elections-coming-soon";
import { ClubAnalyticsTab } from "@/components/clubs/club-analytics-tab";
import { ClubHistoryTab } from "@/components/clubs/club-history-tab";
import { getClubAnalytics } from "@/lib/analytics/club";
import { describeAuditEntry } from "@/lib/audit/describe";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/layout/empty-state";

export interface ClubPageProps {
  params: Promise<{
    clubId: string;
  }>;
  searchParams?: Promise<{
    tab?: string;
    range?: string;
  }>;
}

export async function generateMetadata({
  params,
}: ClubPageProps): Promise<Metadata> {
  const { clubId } = await params;
  const user = await requireUser();
  const club = await getClubDetails(clubId, user.id);

  if (!club) {
    return { title: "Club Not Found | ClubSphere" };
  }

  return {
    title: `${club.name} | ClubSphere`,
    description: club.description.slice(0, 160),
  };
}

export default async function ClubDetailPage({
  params,
  searchParams,
}: ClubPageProps) {
  const user = await requireUser();
  const { clubId } = await params;
  const { tab: activeTab, range: rangeParam } = (await searchParams) ?? {};

  const club = await getClubDetails(clubId, user.id);
  if (!club) {
    notFound();
  }

  const isAdmin = user.role === "ADMIN";
  const isProposer = club.proposerId === user.id;
  const isAdvisor = club.advisorId === user.id;
  const viewerMembership = club.viewerMembership;
  const isActiveMember = viewerMembership?.status === "ACTIVE" || isAdmin;
  const isPresident =
    (isActiveMember && viewerMembership?.role === "PRESIDENT") || isAdmin;
  const isManager =
    (isActiveMember &&
      (viewerMembership?.role === "PRESIDENT" ||
        viewerMembership?.role === "SECRETARY")) ||
    isAdmin;
  const isOfficer =
    (isActiveMember &&
      (viewerMembership?.role === "PRESIDENT" ||
        viewerMembership?.role === "SECRETARY" ||
        viewerMembership?.role === "TREASURER")) ||
    isAdmin;

  const canViewMembers = isActiveMember || isAdvisor || isAdmin;
  const canSeeFullDetails = isManager || isOfficer || isAdvisor || isAdmin;
  const canViewObjectives = club.status === "ACTIVE" || isActiveMember || isAdvisor || isAdmin;
  const canViewAnnouncements = isActiveMember || isAdvisor || isAdmin;
  const canViewAnalytics = isOfficer || isAdvisor || isAdmin;
  const canViewHistory = isOfficer || isAdvisor || isAdmin;

  // Direct URL enforcement: if tab=analytics or tab=history is requested without authorization, throw notFound
  if (activeTab === "analytics" && !canViewAnalytics) {
    notFound();
  }
  if (activeTab === "history" && !canViewHistory) {
    notFound();
  }

  // Settings are visible strictly to the President and Admins
  const canEditSettings = isPresident;

  const canViewReviewDetails = isProposer || isAdvisor || isAdmin;

  // Preload roster & pending requests for Members tab
  const roster = canViewMembers
    ? await getClubRoster(club.id, user.id, user.role)
    : [];
  const pendingRequests = isManager
    ? await getClubPendingRequests(club.id, user.id, user.role)
    : [];

  // Preload objectives for Objectives tab and live Overview statuses
  const objectives = canViewObjectives
    ? await getClubObjectives(club.id)
    : [];

  // Preload events for Events tab
  const events = await getClubEvents(club.id, user.id, isManager, isActiveMember);

  // Preload announcements for Announcements tab
  const announcements = canViewAnnouncements
    ? await getClubAnnouncements(club.id)
    : [];

  // Preload analytics for Analytics tab
  const analyticsData = canViewAnalytics
    ? await getClubAnalytics(club.id, rangeParam, club.createdAt)
    : null;

  // Preload history for History tab
  const historyData = canViewHistory
    ? await (async () => {
        const where = {
          clubId: club.id,
          ...(!isAdmin ? { action: { not: "election.vote_cast" } } : {}),
        };
        const logs = await prisma.auditLog.findMany({
          where,
          take: 26,
          orderBy: { createdAt: "desc" },
        });
        const hasMore = logs.length > 25;
        const items = hasMore ? logs.slice(0, 25) : logs;
        const nextCursor = hasMore ? items[items.length - 1].id : null;

        const actorIds = Array.from(
          new Set(items.map((l) => l.actorId).filter(Boolean))
        ) as string[];

        const actors =
          actorIds.length > 0
            ? await prisma.user.findMany({
                where: { id: { in: actorIds } },
                select: { id: true, name: true, email: true },
              })
            : [];

        const actorMap = new Map(actors.map((a) => [a.id, a]));

        const initialEntries = items.map((log) => {
          const actor = log.actorId ? actorMap.get(log.actorId) : null;
          const actorName =
            actor?.name || actor?.email || (log.actorId ? "Unknown User" : "System");
          return {
            id: log.id,
            action: log.action,
            entityType: log.entityType,
            entityId: log.entityId,
            actorId: log.actorId,
            actorName,
            createdAt: log.createdAt,
            metadata: log.metadata,
            description: describeAuditEntry({
              action: log.action,
              actorName,
              metadata: log.metadata,
              entityType: log.entityType,
              entityId: log.entityId,
            }),
          };
        });

        return { initialEntries, nextCursor };
      })()
    : null;

  const initialTab =
    activeTab === "analytics" && canViewAnalytics
      ? "analytics"
      : activeTab === "history" && canViewHistory
      ? "history"
      : activeTab === "members" && canViewMembers
      ? "members"
      : activeTab === "objectives" && canViewObjectives
      ? "objectives"
      : activeTab === "announcements" && canViewAnnouncements
      ? "announcements"
      : activeTab === "events"
      ? "events"
      : activeTab === "elections" && isActiveMember
      ? "elections"
      : activeTab === "settings" && canEditSettings
      ? "settings"
      : "overview";

  // Visibility enforcement
  if (club.status === "ACTIVE") {
    // Accessible to all signed-in users
  } else if (club.status === "SUSPENDED") {
    if (!isActiveMember && !isAdmin) {
      notFound();
    }
  } else if (club.status === "PENDING" || club.status === "REJECTED") {
    if (!canViewReviewDetails) {
      notFound();
    }
  }

  // Extract designated officers
  const president = club.officers.find((o) => o.role === "PRESIDENT")?.user;
  const secretary = club.officers.find((o) => o.role === "SECRETARY")?.user;
  const treasurer = club.officers.find((o) => o.role === "TREASURER")?.user;

  const showApprovalTimeline =
    (club.status === "PENDING" || club.status === "REJECTED") && canViewReviewDetails;

  return (
    <div className="space-y-8">
      {/* Warning Banner for Suspended Clubs */}
      {club.status === "SUSPENDED" && (
        <div className="rounded-2xl border border-state-error/40 bg-state-error-dim p-5 flex items-start gap-3.5 text-state-error shadow-xs">
          <AlertOctagon className="size-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-semibold text-sm leading-none">
              Organization Temporarily Suspended
            </h3>
            <p className="text-xs text-state-error/90 leading-relaxed">
              This organization is currently suspended by campus administration. Operations, official events, and membership activities are paused pending administrative review.
            </p>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-6 border-b border-surface-border">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-copy-primary">
              {club.name}
            </h1>
            <StatusBadge status={club.status} />

            {/* Viewer's Role Chip */}
            {viewerMembership && (
              <Badge
                variant="secondary"
                className="bg-brand/10 text-brand border-none text-xs font-semibold px-2.5 py-0.5 uppercase tracking-wider"
              >
                {viewerMembership.role} ({viewerMembership.status})
              </Badge>
            )}
            {isProposer && !viewerMembership && (
              <Badge
                variant="secondary"
                className="bg-subtle text-copy-muted border-none text-xs font-medium px-2.5 py-0.5"
              >
                Proposer
              </Badge>
            )}
            {!viewerMembership && !isProposer && (
              <Badge
                variant="outline"
                className="border-surface-border text-copy-muted text-xs px-2.5 py-0.5"
              >
                Campus Visitor
              </Badge>
            )}
          </div>

          <p className="text-xs sm:text-sm text-copy-muted flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              Proposed by <strong className="text-copy-secondary">{club.proposer.name}</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono">
              <Calendar className="size-3.5" />
              {formatDate(club.createdAt)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Users className="size-3.5 text-brand" />
              <strong>{club.activeMemberCount}</strong> active {club.activeMemberCount === 1 ? "member" : "members"}
            </span>
          </p>
        </div>

        {/* Join / Membership Control */}
        <div className="flex items-center gap-3 shrink-0">
          <JoinButton
            clubId={club.id}
            clubStatus={club.status}
            membership={viewerMembership}
            isProfileComplete={isProfileComplete(user)}
          />
        </div>
      </div>

      {/* Charter Approval Timeline (Visible for PENDING/REJECTED to authorized stakeholders) */}
      {showApprovalTimeline && (
        <div className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-4 border-b border-surface-border">
            <ShieldCheck className="size-5 text-brand" />
            <div>
              <h3 className="text-base font-semibold text-copy-primary">
                Charter Approval Timeline
              </h3>
              <p className="text-xs text-copy-muted">
                Track sequential faculty sponsorship and campus administration review stages.
              </p>
            </div>
          </div>

          <ApprovalTimeline approvals={club.approvals} />
        </div>
      )}

      {/* Role-Gated Navigation Tabs */}
      <Tabs defaultValue={initialTab} className="space-y-6">
        <TabsList className="bg-subtle p-1 rounded-xl flex flex-wrap h-auto gap-1">
          <TabsTrigger
            value="overview"
            className="rounded-lg text-xs font-medium px-3.5 py-1.5 data-[state=active]:bg-surface data-[state=active]:text-copy-primary"
          >
            Overview
          </TabsTrigger>

          <TabsTrigger
            value="events"
            className="rounded-lg text-xs font-medium px-3.5 py-1.5 data-[state=active]:bg-surface data-[state=active]:text-copy-primary"
          >
            Events
          </TabsTrigger>

          {/* Members Tab (Active Members, Advisor, and Admins) */}
          {canViewMembers && (
            <TabsTrigger
              value="members"
              className="rounded-lg text-xs font-medium px-3.5 py-1.5 data-[state=active]:bg-surface data-[state=active]:text-copy-primary"
            >
              Members
            </TabsTrigger>
          )}

          {/* Objectives Tab (All signed-in viewers for active clubs, or members/admin) */}
          {canViewObjectives && (
            <TabsTrigger
              value="objectives"
              className="rounded-lg text-xs font-medium px-3.5 py-1.5 data-[state=active]:bg-surface data-[state=active]:text-copy-primary"
            >
              Objectives
            </TabsTrigger>
          )}

          {/* Announcements Tab (Active Members, Advisor, and Admins) */}
          {canViewAnnouncements && (
            <TabsTrigger
              value="announcements"
              className="rounded-lg text-xs font-medium px-3.5 py-1.5 data-[state=active]:bg-surface data-[state=active]:text-copy-primary"
            >
              Announcements
              {announcements.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 text-[10px] px-1.5 py-0 bg-surface-border text-copy-secondary"
                >
                  {announcements.length}
                </Badge>
              )}
            </TabsTrigger>
          )}

          {/* Member-Only Elections Tab */}
          {isActiveMember && (
            <TabsTrigger
              value="elections"
              className="rounded-lg text-xs font-medium px-3.5 py-1.5 data-[state=active]:bg-surface data-[state=active]:text-copy-primary"
            >
              Elections
            </TabsTrigger>
          )}

          {/* Analytics Tab (Officers, Advisor, and Admins) */}
          {canViewAnalytics && (
            <TabsTrigger
              value="analytics"
              className="rounded-lg text-xs font-medium px-3.5 py-1.5 data-[state=active]:bg-surface data-[state=active]:text-copy-primary"
            >
              <BarChart3 className="size-3.5 mr-1" />
              Analytics
            </TabsTrigger>
          )}

          {/* History Tab (Officers, Advisor, and Admins) */}
          {canViewHistory && (
            <TabsTrigger
              value="history"
              className="rounded-lg text-xs font-medium px-3.5 py-1.5 data-[state=active]:bg-surface data-[state=active]:text-copy-primary"
            >
              <History className="size-3.5 mr-1" />
              History
            </TabsTrigger>
          )}

          {/* President & Admin Only Tab */}
          {canEditSettings && (
            <TabsTrigger
              value="settings"
              className="rounded-lg text-xs font-medium px-3.5 py-1.5 data-[state=active]:bg-surface data-[state=active]:text-copy-primary ml-auto"
            >
              <Settings className="size-3.5 mr-1" />
              Settings
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="space-y-8 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Columns: Description & Objectives */}
            <div className="lg:col-span-2 space-y-8">
              {/* Mission Statement */}
              <div className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-7 shadow-xs space-y-4">
                <h3 className="text-base font-semibold text-copy-primary">
                  About the Organization
                </h3>
                <p className="text-sm text-copy-secondary leading-relaxed whitespace-pre-line">
                  {club.description}
                </p>
              </div>

              {/* Charter Objectives */}
              <div className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-brand" />
                    <h3 className="text-base font-semibold text-copy-primary">
                      Charter Objectives
                    </h3>
                  </div>
                  <span className="text-xs text-copy-muted font-mono">
                    {(objectives.length > 0 ? objectives : club.objectives).length}{" "}
                    {(objectives.length > 0 ? objectives : club.objectives).length === 1 ? "goal" : "goals"}
                  </span>
                </div>

                <div className="space-y-3">
                  {(objectives.length > 0 ? objectives : club.objectives).map((obj, index) => (
                    <div
                      key={obj.id}
                      className="flex items-start justify-between gap-3.5 rounded-xl border border-surface-border/70 bg-subtle/40 p-4"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-surface text-xs font-mono font-bold text-brand shadow-xs">
                          {index + 1}
                        </span>
                        <div className="min-w-0 space-y-1">
                          <p className="text-sm font-medium text-copy-primary leading-snug">
                            {obj.title}
                          </p>
                          {obj.description && (
                            <p className="text-xs text-copy-secondary">
                              {obj.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <ObjectiveStatusBadge status={obj.status} className="shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Officers & Advisor */}
            <div className="space-y-6">
              {/* Executive Officers */}
              <div className="rounded-2xl border border-surface-border bg-surface p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-copy-muted">
                  <UserCheck className="size-4 text-brand" />
                  Executive Leadership
                </div>

                <div className="space-y-3 text-xs divide-y divide-surface-border">
                  <div className="pt-1 first:pt-0 space-y-0.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-copy-muted block">
                      President
                    </span>
                    <span className="text-sm font-medium text-copy-primary block">
                      {president?.name || "Vacant"}
                    </span>
                    {president?.email && (
                      <span className="text-copy-muted flex items-center gap-1">
                        <Mail className="size-3 text-copy-muted" />
                        {president.email}
                      </span>
                    )}
                  </div>

                  <div className="pt-3 space-y-0.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-copy-muted block">
                      Secretary
                    </span>
                    <span className="text-sm font-medium text-copy-primary block">
                      {secretary?.name || "Vacant"}
                    </span>
                    {secretary?.email && (
                      <span className="text-copy-muted flex items-center gap-1">
                        <Mail className="size-3 text-copy-muted" />
                        {secretary.email}
                      </span>
                    )}
                  </div>

                  <div className="pt-3 space-y-0.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-copy-muted block">
                      Treasurer
                    </span>
                    <span className="text-sm font-medium text-copy-primary block">
                      {treasurer?.name || "Vacant"}
                    </span>
                    {treasurer?.email && (
                      <span className="text-copy-muted flex items-center gap-1">
                        <Mail className="size-3 text-copy-muted" />
                        {treasurer.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Faculty Advisor */}
              <div className="rounded-2xl border border-surface-border bg-surface p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-copy-muted">
                  <GraduationCap className="size-4 text-brand" />
                  Faculty Sponsor
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-copy-primary">
                    {club.advisor.name}
                  </h4>
                  {club.advisor.department && (
                    <p className="text-xs text-copy-secondary flex items-center gap-1.5 mt-1">
                      <Building2 className="size-3.5 text-copy-muted" />
                      {club.advisor.department}
                    </p>
                  )}
                  {club.advisor.email && (
                    <p className="text-xs text-copy-muted flex items-center gap-1.5 mt-1">
                      <Mail className="size-3 text-copy-muted" />
                      {club.advisor.email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Events */}
        <TabsContent value="events" className="outline-none">
          <ClubEventsTab clubId={club.id} events={events} isManager={isManager} />
        </TabsContent>

        {/* Tab 3: Members View (Active Members, Advisor, and Admins) */}
        {canViewMembers && (
          <TabsContent value="members" className="outline-none">
            <ClubMembersView
              clubId={club.id}
              initialRoster={roster}
              initialRequests={pendingRequests}
              isManager={isManager}
              isPresident={isPresident}
              canSeeFullDetails={canSeeFullDetails}
            />
          </TabsContent>
        )}

        {/* Tab 4: Objectives View */}
        {canViewObjectives && (
          <TabsContent value="objectives" className="outline-none">
            <ClubObjectivesView
              clubId={club.id}
              initialObjectives={objectives}
              isManager={isManager}
            />
          </TabsContent>
        )}

        {/* Tab 5: Elections Coming Soon (Members Only) */}
        {isActiveMember && (
          <TabsContent value="elections" className="outline-none">
            <ClubElectionsComingSoon clubId={club.id} isManager={isManager} />
          </TabsContent>
        )}

        {/* Tab 6: Announcements View (Active Members, Advisor, and Admins) */}
        {canViewAnnouncements && (
          <TabsContent value="announcements" className="outline-none">
            <ClubAnnouncementsTab
              clubId={club.id}
              initialAnnouncements={announcements}
              isManager={isManager}
              clubEvents={events.map((e) => ({ id: e.id, title: e.title }))}
            />
          </TabsContent>
        )}

        {/* Tab 7: Organization Settings (President & Admin Only) */}
        {canEditSettings && (
          <TabsContent value="settings" className="outline-none">
            <div className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-8 shadow-xs max-w-2xl">
              <div className="mb-6 pb-4 border-b border-surface-border">
                <h3 className="text-base font-semibold text-copy-primary">
                  Organization Profile Settings
                </h3>
                <p className="text-xs text-copy-muted">
                  Update public charter details, mission statement, and description.
                </p>
              </div>
              <ClubSettingsForm club={club} isAdmin={isAdmin} />
            </div>
          </TabsContent>
        )}

        {/* Tab 8: Analytics View (Officers, Advisor, and Admins) */}
        {canViewAnalytics && analyticsData && (
          <TabsContent value="analytics" className="outline-none">
            <ClubAnalyticsTab clubId={club.id} data={analyticsData} />
          </TabsContent>
        )}

        {/* Tab 9: History View (Officers, Advisor, and Admins) */}
        {canViewHistory && historyData && (
          <TabsContent value="history" className="outline-none">
            <ClubHistoryTab
              clubId={club.id}
              initialEntries={historyData.initialEntries}
              initialCursor={historyData.nextCursor}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
