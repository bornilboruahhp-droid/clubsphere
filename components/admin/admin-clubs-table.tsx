"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  Search,
  AlertOctagon,
  CheckCircle2,
  UserCheck,
  ArrowRight,
  Loader2,
  MoreHorizontal,
} from "lucide-react";
import { ClubStatus } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/clubs/status-badge";
import { formatDate } from "@/lib/format";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface AdminClubRow {
  id: string;
  name: string;
  status: ClubStatus;
  createdAt: string | Date;
  advisor: {
    id: string;
    name: string;
    email: string;
  };
  activeMembersCount: number;
  eventsHeldCount: number;
}

export interface AvailableAdvisor {
  id: string;
  name: string;
  email: string;
  department?: string | null;
}

interface AdminClubsTableProps {
  initialClubs: AdminClubRow[];
  advisors: AvailableAdvisor[];
}

export function AdminClubsTable({
  initialClubs,
  advisors,
}: AdminClubsTableProps) {
  const router = useRouter();
  const [clubs, setClubs] = useState<AdminClubRow[]>(initialClubs);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Suspension dialog state
  const [suspendingClub, setSuspendingClub] = useState<AdminClubRow | null>(null);
  const [suspendReason, setSuspendReason] = useState("");

  // Reactivation dialog state
  const [reactivatingClub, setReactivatingClub] = useState<AdminClubRow | null>(null);

  // Advisor dialog state
  const [reassigningClub, setReassigningClub] = useState<AdminClubRow | null>(null);
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string>("");

  const filteredClubs = useMemo(() => {
    return clubs.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.advisor.name.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || c.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [clubs, search, statusFilter]);

  // Handle Suspend
  const handleSuspend = async () => {
    if (!suspendingClub) return;
    if (suspendReason.trim().length < 5) {
      toast.error("Suspension reason must be at least 5 characters.");
      return;
    }

    setLoadingId(suspendingClub.id);
    try {
      const res = await fetch(`/api/admin/clubs/${suspendingClub.id}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: suspendReason.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to suspend club");
      }

      setClubs((prev) =>
        prev.map((c) =>
          c.id === suspendingClub.id ? { ...c, status: ClubStatus.SUSPENDED } : c
        )
      );

      toast.success(`Organization "${suspendingClub.name}" has been suspended.`);
      setSuspendingClub(null);
      setSuspendReason("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to suspend club.");
    } finally {
      setLoadingId(null);
    }
  };

  // Handle Reactivate
  const handleReactivate = async () => {
    if (!reactivatingClub) return;

    setLoadingId(reactivatingClub.id);
    try {
      const res = await fetch(`/api/admin/clubs/${reactivatingClub.id}/reactivate`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to reactivate club");
      }

      setClubs((prev) =>
        prev.map((c) =>
          c.id === reactivatingClub.id ? { ...c, status: ClubStatus.ACTIVE } : c
        )
      );

      toast.success(`Organization "${reactivatingClub.name}" has been reactivated.`);
      setReactivatingClub(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to reactivate club.");
    } finally {
      setLoadingId(null);
    }
  };

  // Handle Reassign Advisor
  const handleReassignAdvisor = async () => {
    if (!reassigningClub || !selectedAdvisorId) return;

    setLoadingId(reassigningClub.id);
    try {
      const res = await fetch(`/api/admin/clubs/${reassigningClub.id}/advisor`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ advisorId: selectedAdvisorId }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to reassign advisor");
      }

      const newAdvisorObj = advisors.find((a) => a.id === selectedAdvisorId);

      setClubs((prev) =>
        prev.map((c) =>
          c.id === reassigningClub.id && newAdvisorObj
            ? {
                ...c,
                advisor: {
                  id: newAdvisorObj.id,
                  name: newAdvisorObj.name,
                  email: newAdvisorObj.email,
                },
              }
            : c
        )
      );

      toast.success(`Faculty advisor updated for "${reassigningClub.name}".`);
      setReassigningClub(null);
      setSelectedAdvisorId("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to reassign advisor.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Status Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-4 rounded-2xl border border-surface-border shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-copy-muted pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by club or advisor name..."
            className="pl-9 bg-background border-surface-border text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] bg-background border-surface-border text-xs">
              <SelectValue placeholder="Status: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active Only</SelectItem>
              <SelectItem value="PENDING">Pending Review</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <span className="text-xs text-copy-muted font-medium px-2">
            {filteredClubs.length} of {clubs.length} clubs
          </span>
        </div>
      </div>

      {/* Clubs Table */}
      <div className="rounded-2xl border border-surface-border bg-surface overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Club Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Faculty Advisor</TableHead>
              <TableHead className="text-right">Active Members</TableHead>
              <TableHead className="text-right">Events Held</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClubs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-xs text-copy-muted">
                  No organizations match the filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredClubs.map((club) => (
                <TableRow key={club.id}>
                  <TableCell className="font-semibold text-copy-primary">
                    <Link
                      href={`/clubs/${club.id}`}
                      className="hover:text-brand hover:underline"
                    >
                      {club.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={club.status} />
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="font-medium text-copy-primary">
                      {club.advisor.name}
                    </div>
                    <div className="text-[11px] text-copy-muted">
                      {club.advisor.email}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {club.activeMembersCount}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {club.eventsHeldCount}
                  </TableCell>
                  <TableCell className="text-xs text-copy-muted whitespace-nowrap">
                    {formatDate(club.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-8 p-0"
                          disabled={loadingId === club.id}
                        >
                          {loadingId === club.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="size-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 text-xs">
                        <DropdownMenuItem asChild>
                          <Link href={`/clubs/${club.id}`} className="gap-2">
                            <ArrowRight className="size-3.5" />
                            Open Club
                          </Link>
                        </DropdownMenuItem>

                        {(club.status === "PENDING" || club.status === "ACTIVE") && (
                          <DropdownMenuItem
                            onClick={() => {
                              setReassigningClub(club);
                              setSelectedAdvisorId(club.advisor.id);
                            }}
                            className="gap-2"
                          >
                            <UserCheck className="size-3.5" />
                            Change Advisor
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />

                        {club.status === "ACTIVE" && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSuspendingClub(club);
                              setSuspendReason("");
                            }}
                            className="gap-2 text-state-error focus:text-state-error"
                          >
                            <AlertOctagon className="size-3.5" />
                            Suspend Club
                          </DropdownMenuItem>
                        )}

                        {club.status === "SUSPENDED" && (
                          <DropdownMenuItem
                            onClick={() => setReactivatingClub(club)}
                            className="gap-2 text-state-success focus:text-state-success"
                          >
                            <CheckCircle2 className="size-3.5" />
                            Reactivate Club
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Suspend Confirmation Dialog */}
      <AlertDialog
        open={!!suspendingClub}
        onOpenChange={(open) => !open && setSuspendingClub(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-state-error">
              <AlertOctagon className="size-5" />
              Suspend Organization?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Suspending <strong>{suspendingClub?.name}</strong> will pause all official
              operations, make events and membership read-only, and notify all active members
              and the faculty sponsor.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 py-2">
            <label className="text-xs font-semibold text-copy-primary">
              Suspension Reason (Required, min 5 chars)
            </label>
            <Textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="e.g. Conduct review pending, missing annual safety audit..."
              className="text-xs"
              rows={3}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!loadingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleSuspend();
              }}
              disabled={suspendReason.trim().length < 5 || !!loadingId}
              className="bg-state-error text-white hover:bg-state-error/90"
            >
              {loadingId ? (
                <Loader2 className="size-4 animate-spin mr-1.5" />
              ) : null}
              Confirm Suspension
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reactivate Confirmation Dialog */}
      <AlertDialog
        open={!!reactivatingClub}
        onOpenChange={(open) => !open && setReactivatingClub(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-state-success">
              <CheckCircle2 className="size-5" />
              Reactivate Organization?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Reactivating <strong>{reactivatingClub?.name}</strong> will restore full
              operational status, allowing officers to resume event management and membership
              onboarding.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!loadingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleReactivate();
              }}
              disabled={!!loadingId}
              className="bg-state-success text-white hover:bg-state-success/90"
            >
              {loadingId ? (
                <Loader2 className="size-4 animate-spin mr-1.5" />
              ) : null}
              Reactivate Organization
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reassign Advisor Dialog */}
      <Dialog
        open={!!reassigningClub}
        onOpenChange={(open) => !open && setReassigningClub(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Faculty Sponsor</DialogTitle>
            <DialogDescription>
              Select a qualified faculty advisor for{" "}
              <strong>{reassigningClub?.name}</strong>. If a review is currently pending,
              the new sponsor will inherit it.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-2">
            <label className="text-xs font-semibold text-copy-primary">
              Select New Faculty Advisor
            </label>
            <Select
              value={selectedAdvisorId}
              onValueChange={setSelectedAdvisorId}
            >
              <SelectTrigger className="w-full text-xs">
                <SelectValue placeholder="Choose an advisor..." />
              </SelectTrigger>
              <SelectContent>
                {advisors.map((adv) => (
                  <SelectItem key={adv.id} value={adv.id} className="text-xs">
                    {adv.name} ({adv.email})
                    {adv.department ? ` - ${adv.department}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReassigningClub(null)}
              disabled={!!loadingId}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReassignAdvisor}
              disabled={!selectedAdvisorId || !!loadingId}
              className="bg-brand text-white hover:bg-brand/90"
            >
              {loadingId ? (
                <Loader2 className="size-4 animate-spin mr-1.5" />
              ) : null}
              Confirm Reassignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
