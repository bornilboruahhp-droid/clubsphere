"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Users,
  UserCheck,
  UserX,
  Search,
  Mail,
  GraduationCap,
  Calendar,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  Download,
} from "lucide-react";
import type { ClubMemberItem, ClubPendingRequestItem } from "@/lib/data/members";
import type { ClubRole } from "@prisma/client";
import { formatDate } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/layout/empty-state";
import { MemberActionsMenu } from "./member-actions-menu";

interface ClubMembersViewProps {
  clubId: string;
  initialRoster: ClubMemberItem[];
  initialRequests: ClubPendingRequestItem[];
  isManager: boolean;
  isPresident: boolean;
  canSeeFullDetails: boolean;
}

export function ClubMembersView({
  clubId,
  initialRoster,
  initialRequests,
  isManager,
  isPresident,
  canSeeFullDetails,
}: ClubMembersViewProps) {
  const router = useRouter();
  const [roster, setRoster] = useState<ClubMemberItem[]>(initialRoster);
  const [requests, setRequests] = useState<ClubPendingRequestItem[]>(initialRequests);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filter roster by name search
  const filteredRoster = useMemo(() => {
    if (!searchQuery.trim()) return roster;
    const q = searchQuery.toLowerCase().trim();
    return roster.filter((m) => m.user.name.toLowerCase().includes(q));
  }, [roster, searchQuery]);

  // Track current officers for role assignment collision warnings
  const currentTreasurer = useMemo(
    () =>
      roster.find((m) => m.role === "TREASURER")
        ? {
            id: roster.find((m) => m.role === "TREASURER")!.id,
            name: roster.find((m) => m.role === "TREASURER")!.user.name,
          }
        : null,
    [roster]
  );

  const currentSecretary = useMemo(
    () =>
      roster.find((m) => m.role === "SECRETARY")
        ? {
            id: roster.find((m) => m.role === "SECRETARY")!.id,
            name: roster.find((m) => m.role === "SECRETARY")!.user.name,
          }
        : null,
    [roster]
  );

  const handleMemberUpdated = (updated: ClubMemberItem) => {
    setRoster((prev) =>
      prev.map((m) => {
        if (m.id === updated.id) {
          return updated;
        }
        // If updated is an officer and another held that office, demote them
        if (
          (updated.role === "TREASURER" && m.role === "TREASURER") ||
          (updated.role === "SECRETARY" && m.role === "SECRETARY")
        ) {
          return { ...m, role: "MEMBER" as ClubRole };
        }
        return m;
      })
    );
    router.refresh();
  };

  const handleMemberRemoved = (membershipId: string) => {
    setRoster((prev) => prev.filter((m) => m.id !== membershipId));
    router.refresh();
  };

  const handleRequestDecision = async (
    requestId: string,
    action: "approve" | "reject"
  ) => {
    setActionLoadingId(requestId);
    try {
      const res = await fetch(`/api/clubs/${clubId}/members/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || `Failed to ${action} request`);
      }

      toast.success(
        action === "approve"
          ? "Membership request approved"
          : "Membership request rejected"
      );

      // Remove from requests list
      const targetReq = requests.find((r) => r.id === requestId);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));

      // If approved, add to roster
      if (action === "approve" && targetReq) {
        setRoster((prev) => [
          ...prev,
          {
            id: targetReq.id,
            userId: targetReq.userId,
            role: "MEMBER",
            status: "ACTIVE",
            joinedAt: new Date(),
            user: targetReq.user,
          },
        ]);
      }

      router.refresh();
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action} request`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const getRoleBadge = (role: ClubRole) => {
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
    <div className="space-y-6">
      <Tabs defaultValue="roster" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-surface-border">
          <TabsList className="bg-subtle border border-surface-border p-1 rounded-xl">
            <TabsTrigger
              value="roster"
              className="rounded-lg text-xs font-medium px-3.5 py-1.5 data-[state=active]:bg-surface data-[state=active]:text-copy-primary gap-2"
            >
              <Users className="size-3.5 text-copy-muted" />
              <span>Roster</span>
              <span className="size-5 rounded-full bg-surface-border/60 text-[11px] font-mono flex items-center justify-center font-bold">
                {roster.length}
              </span>
            </TabsTrigger>

            {isManager && (
              <TabsTrigger
                value="requests"
                className="rounded-lg text-xs font-medium px-3.5 py-1.5 data-[state=active]:bg-surface data-[state=active]:text-copy-primary gap-2"
              >
                <Clock className="size-3.5 text-state-warning" />
                <span>Requests</span>
                {requests.length > 0 && (
                  <span className="size-5 rounded-full bg-state-warning text-state-warning-foreground text-[11px] font-mono flex items-center justify-center font-bold">
                    {requests.length}
                  </span>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          {/* Search box and Export button for roster tab */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-copy-muted" />
              <Input
                type="search"
                placeholder="Filter members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 text-xs rounded-xl bg-surface border-surface-border"
              />
            </div>

            {canSeeFullDetails && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-9 px-3 text-xs gap-1.5 shrink-0 rounded-xl border-surface-border"
              >
                <a href={`/api/clubs/${clubId}/reports/members`} download>
                  <Download className="size-3.5 text-copy-muted" />
                  <span className="hidden sm:inline">Export</span> CSV
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Tab 1: Active Member Roster */}
        <TabsContent value="roster" className="outline-none pt-2">
          {filteredRoster.length === 0 ? (
            <EmptyState
              icon={Users}
              title={searchQuery ? "No members match search" : "No active members"}
              description={
                searchQuery
                  ? "Try searching with a different name or clear the filter."
                  : "Members will appear here once approved by club management."
              }
            />
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block rounded-2xl border border-surface-border bg-surface overflow-hidden shadow-xs">
                <Table>
                  <TableHeader className="bg-subtle/50">
                    <TableRow className="border-surface-border hover:bg-transparent">
                      <TableHead className="text-copy-muted text-xs font-semibold uppercase tracking-wider">
                        Member
                      </TableHead>
                      <TableHead className="text-copy-muted text-xs font-semibold uppercase tracking-wider">
                        Role
                      </TableHead>
                      {canSeeFullDetails && (
                        <>
                          <TableHead className="text-copy-muted text-xs font-semibold uppercase tracking-wider">
                            Student ID
                          </TableHead>
                          <TableHead className="text-copy-muted text-xs font-semibold uppercase tracking-wider">
                            Email
                          </TableHead>
                        </>
                      )}
                      <TableHead className="text-copy-muted text-xs font-semibold uppercase tracking-wider">
                        Joined Date
                      </TableHead>
                      {isPresident && (
                        <TableHead className="text-right text-copy-muted text-xs font-semibold uppercase tracking-wider pr-4">
                          Actions
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRoster.map((m) => (
                      <TableRow
                        key={m.id}
                        className="border-surface-border hover:bg-subtle/30 transition-colors"
                      >
                        <TableCell className="font-medium text-copy-primary">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-brand/10 text-brand flex items-center justify-center font-semibold text-xs shrink-0">
                              {m.user.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate">{m.user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(m.role)}</TableCell>
                        {canSeeFullDetails && (
                          <>
                            <TableCell className="font-mono text-xs text-copy-secondary">
                              {m.user.studentId || "—"}
                            </TableCell>
                            <TableCell className="text-xs text-copy-muted">
                              {m.user.email ? (
                                <a
                                  href={`mailto:${m.user.email}`}
                                  className="hover:text-brand hover:underline inline-flex items-center gap-1.5"
                                >
                                  <Mail className="size-3 text-copy-muted" />
                                  {m.user.email}
                                </a>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                          </>
                        )}
                        <TableCell className="text-xs text-copy-muted">
                          {m.joinedAt ? formatDate(m.joinedAt) : "—"}
                        </TableCell>
                        {isPresident && (
                          <TableCell className="text-right pr-4">
                            <MemberActionsMenu
                              clubId={clubId}
                              member={m}
                              currentTreasurer={currentTreasurer}
                              currentSecretary={currentSecretary}
                              onMemberUpdated={handleMemberUpdated}
                              onMemberRemoved={handleMemberRemoved}
                            />
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards View */}
              <div className="md:hidden space-y-3">
                {filteredRoster.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-2xl border border-surface-border bg-surface p-4 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-9 rounded-full bg-brand/10 text-brand flex items-center justify-center font-semibold text-xs shrink-0">
                          {m.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-copy-primary truncate">
                            {m.user.name}
                          </p>
                          <div className="mt-1">{getRoleBadge(m.role)}</div>
                        </div>
                      </div>

                      {isPresident && (
                        <MemberActionsMenu
                          clubId={clubId}
                          member={m}
                          currentTreasurer={currentTreasurer}
                          currentSecretary={currentSecretary}
                          onMemberUpdated={handleMemberUpdated}
                          onMemberRemoved={handleMemberRemoved}
                        />
                      )}
                    </div>

                    <div className="pt-2 border-t border-surface-border/60 text-xs text-copy-muted space-y-1.5">
                      {canSeeFullDetails && m.user.studentId && (
                        <div className="flex items-center gap-2">
                          <GraduationCap className="size-3.5 text-copy-muted" />
                          <span className="font-mono text-copy-secondary">
                            {m.user.studentId}
                          </span>
                        </div>
                      )}
                      {canSeeFullDetails && m.user.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="size-3.5 text-copy-muted" />
                          <a
                            href={`mailto:${m.user.email}`}
                            className="hover:underline text-copy-secondary truncate"
                          >
                            {m.user.email}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="size-3.5 text-copy-muted" />
                        <span>Joined {m.joinedAt ? formatDate(m.joinedAt) : "—"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Tab 2: Pending Requests View (Managers & Admin) */}
        {isManager && (
          <TabsContent value="requests" className="outline-none pt-2">
            {requests.length === 0 ? (
              <EmptyState
                icon={UserCheck}
                title="No pending requests"
                description="All membership applications have been reviewed."
              />
            ) : (
              <div className="space-y-3">
                {requests.map((r) => {
                  const isLoading = actionLoadingId === r.id;
                  return (
                    <div
                      key={r.id}
                      className="rounded-2xl border border-surface-border bg-surface p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="size-10 rounded-full bg-state-warning-dim text-state-warning flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                          {r.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-semibold text-copy-primary">
                              {r.user.name}
                            </h4>
                            {r.user.studentId && (
                              <Badge
                                variant="outline"
                                className="font-mono text-[11px] px-2 py-0 border-surface-border text-copy-muted"
                              >
                                {r.user.studentId}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-copy-muted">
                            <span className="flex items-center gap-1">
                              <Mail className="size-3" />
                              {r.user.email}
                            </span>
                            {r.user.department && (
                              <span>Dept: {r.user.department}</span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" />
                              Requested {formatDate(r.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Decision Action Buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRequestDecision(r.id, "reject")}
                          disabled={isLoading}
                          className="h-8 text-xs border-surface-border text-state-error hover:bg-state-error-dim hover:text-state-error gap-1.5"
                        >
                          {isLoading ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <XCircle className="size-3.5" />
                          )}
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleRequestDecision(r.id, "approve")}
                          disabled={isLoading}
                          className="h-8 text-xs bg-brand text-brand-foreground hover:bg-brand/90 gap-1.5 font-medium shadow-xs"
                        >
                          {isLoading ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="size-3.5" />
                          )}
                          Approve
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
