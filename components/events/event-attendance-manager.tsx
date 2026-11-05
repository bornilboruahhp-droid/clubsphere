"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  Check,
  X,
  UserCheck,
  AlertCircle,
  Users,
  CheckSquare,
  Square,
  Loader2,
  Calendar,
  Download,
} from "lucide-react";
import type { AttendanceStatus, EventStatus } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDateTime } from "@/lib/format";

export interface AttendeeRecord {
  id: string;
  status: AttendanceStatus;
  statusChangedAt: string | Date;
  checkedInAt: string | Date | null;
  createdAt: string | Date;
  user: {
    id: string;
    name: string;
    email: string;
    studentId: string | null;
  };
}

interface EventAttendanceManagerProps {
  eventId: string;
  clubId: string;
  eventStatus: EventStatus;
  startsAt: string | Date;
  initialAttendees: AttendeeRecord[];
}

export function EventAttendanceManager({
  eventId,
  clubId,
  eventStatus,
  startsAt,
  initialAttendees,
}: EventAttendanceManagerProps) {
  const router = useRouter();
  const [attendees, setAttendees] = useState<AttendeeRecord[]>(initialAttendees);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false);

  const now = new Date();
  const startDate = new Date(startsAt);
  const isStartedOrCompleted =
    (eventStatus === "PUBLISHED" && startDate <= now) ||
    eventStatus === "COMPLETED";

  // Summary counts
  const counts = useMemo(() => {
    let registered = 0;
    let present = 0;
    let absent = 0;
    let cancelled = 0;

    for (const a of attendees) {
      if (a.status === "REGISTERED") registered++;
      else if (a.status === "PRESENT") present++;
      else if (a.status === "ABSENT") absent++;
      else if (a.status === "CANCELLED") cancelled++;
    }

    return {
      total: attendees.length - cancelled,
      registered,
      present,
      absent,
      cancelled,
    };
  }, [attendees]);

  // Filtered attendees
  const filteredAttendees = useMemo(() => {
    return attendees.filter((a) => {
      // Exclude cancelled from active views unless filter specifically requests it
      if (statusFilter !== "CANCELLED" && a.status === "CANCELLED") {
        return false;
      }

      if (statusFilter !== "ALL" && a.status !== statusFilter) {
        return false;
      }

      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const matchesName = a.user.name.toLowerCase().includes(query);
        const matchesEmail = a.user.email.toLowerCase().includes(query);
        const matchesStudentId = a.user.studentId?.toLowerCase().includes(query);
        return matchesName || matchesEmail || Boolean(matchesStudentId);
      }

      return true;
    });
  }, [attendees, search, statusFilter]);

  // Select all matching filter
  const isAllSelected =
    filteredAttendees.length > 0 &&
    filteredAttendees.every((a) => selectedIds.has(a.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      const newSet = new Set(selectedIds);
      for (const a of filteredAttendees) {
        if (a.status !== "CANCELLED") {
          newSet.add(a.id);
        }
      }
      setSelectedIds(newSet);
    }
  };

  const toggleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // Single attendance update
  const handleSingleUpdate = async (
    registrationId: string,
    targetStatus: "PRESENT" | "ABSENT"
  ) => {
    if (!isStartedOrCompleted) {
      toast.error("Attendance can only be recorded once the event has started.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/events/${eventId}/registrations/${registrationId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: targetStatus }),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to update attendance");
      }

      // Update local state without full reload
      setAttendees((prev) =>
        prev.map((item) =>
          item.id === registrationId
            ? {
                ...item,
                status: targetStatus,
                statusChangedAt: new Date(),
                checkedInAt:
                  targetStatus === "PRESENT"
                    ? item.checkedInAt ?? new Date()
                    : item.checkedInAt,
              }
            : item
        )
      );

      toast.success(
        `Marked as ${targetStatus === "PRESENT" ? "Present" : "Absent"}`
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update attendance.");
    } finally {
      setIsLoading(false);
    }
  };

  // Bulk attendance update
  const handleBulkUpdate = async (targetStatus: "PRESENT" | "ABSENT") => {
    if (!isStartedOrCompleted) {
      toast.error("Attendance can only be recorded once the event has started.");
      return;
    }

    const idsToUpdate = Array.from(selectedIds);
    if (idsToUpdate.length === 0) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/attendance/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationIds: idsToUpdate,
          status: targetStatus,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to apply bulk update");
      }

      const updatedSet = new Set(idsToUpdate);
      setAttendees((prev) =>
        prev.map((item) =>
          updatedSet.has(item.id) && item.status !== "CANCELLED"
            ? {
                ...item,
                status: targetStatus,
                statusChangedAt: new Date(),
                checkedInAt:
                  targetStatus === "PRESENT"
                    ? item.checkedInAt ?? new Date()
                    : item.checkedInAt,
              }
            : item
        )
      );

      setSelectedIds(new Set());
      toast.success(
        `Marked ${data.data?.updatedCount || idsToUpdate.length} attendees as ${
          targetStatus === "PRESENT" ? "Present" : "Absent"
        }`
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to apply bulk update.");
    } finally {
      setIsLoading(false);
    }
  };

  // Finalize attendance
  const handleFinalize = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/attendance/finalize`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to finalize attendance");
      }

      setAttendees((prev) =>
        prev.map((item) =>
          item.status === "REGISTERED"
            ? {
                ...item,
                status: "ABSENT",
                statusChangedAt: new Date(),
              }
            : item
        )
      );

      setIsFinalizeDialogOpen(false);
      setSelectedIds(new Set());
      toast.success(
        `Attendance finalized: ${data.data?.finalizedCount || 0} unmarked attendees marked as Absent.`
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to finalize attendance.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Event Not Started Banner */}
      {!isStartedOrCompleted && (
        <div className="rounded-xl border border-state-warning/30 bg-state-warning-dim p-4 flex items-start gap-3 text-state-warning text-xs sm:text-sm">
          <Calendar className="size-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold block">Event Scheduled in Future</span>
            <p className="text-state-warning/90 leading-relaxed text-xs">
              Live check-in and attendance recording will automatically activate
              once the event begins on {formatDateTime(startsAt)}.
            </p>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-surface-border bg-surface p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-copy-muted uppercase tracking-wider block">
            Total RSVPs
          </span>
          <span className="text-2xl font-bold text-copy-primary mt-1 block">
            {counts.total}
          </span>
        </div>

        <div className="rounded-xl border border-state-info/20 bg-state-info-dim/30 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-state-info uppercase tracking-wider block">
            Unmarked
          </span>
          <span className="text-2xl font-bold text-state-info mt-1 block">
            {counts.registered}
          </span>
        </div>

        <div className="rounded-xl border border-state-success/20 bg-state-success-dim/30 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-state-success uppercase tracking-wider block">
            Present
          </span>
          <span className="text-2xl font-bold text-state-success mt-1 block">
            {counts.present}
          </span>
        </div>

        <div className="rounded-xl border border-state-error/20 bg-state-error-dim/30 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-state-error uppercase tracking-wider block">
            Absent
          </span>
          <span className="text-2xl font-bold text-state-error mt-1 block">
            {counts.absent}
          </span>
        </div>
      </div>

      {/* Controls Bar: Search, Status Filter, and Finalize Button */}
      <div className="rounded-2xl border border-surface-border bg-surface p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-copy-muted pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or student ID..."
              className="pl-9 bg-background border-surface-border text-xs sm:text-sm"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Select Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-background border-surface-border text-xs">
                <SelectValue placeholder="All Attendees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Active</SelectItem>
                <SelectItem value="REGISTERED">Unmarked</SelectItem>
                <SelectItem value="PRESENT">Present</SelectItem>
                <SelectItem value="ABSENT">Absent</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Export Attendance CSV Button */}
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-surface-border text-copy-primary hover:bg-subtle text-xs font-medium gap-1.5"
            >
              <a href={`/api/events/${eventId}/reports/attendance`} download>
                <Download className="size-3.5 text-copy-muted" />
                Export CSV
              </a>
            </Button>

            {/* Finalize Attendance Dialog */}
            <AlertDialog
              open={isFinalizeDialogOpen}
              onOpenChange={setIsFinalizeDialogOpen}
            >
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!isStartedOrCompleted || counts.registered === 0 || isLoading}
                  className="border-surface-border text-copy-primary hover:bg-subtle text-xs font-medium"
                >
                  Finalize Attendance
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Finalize event attendance?</AlertDialogTitle>
                  <AlertDialogDescription>
                    All {counts.registered} remaining unmarked attendee(s) will be
                    automatically recorded as <strong>Absent</strong>. You will still
                    be able to update individual attendance statuses later if needed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault();
                      handleFinalize();
                    }}
                    className="bg-brand text-white hover:bg-brand/90"
                  >
                    {isLoading ? (
                      <Loader2 className="size-4 animate-spin mr-1.5" />
                    ) : null}
                    Confirm & Finalize
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Bulk Action Strip when rows are checked */}
        {selectedIds.size > 0 && (
          <div className="rounded-xl border border-brand/20 bg-brand/5 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-brand flex items-center gap-1.5">
              <CheckSquare className="size-4" />
              {selectedIds.size} attendee(s) selected
            </span>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={isLoading || !isStartedOrCompleted}
                onClick={() => handleBulkUpdate("PRESENT")}
                className="border-state-success/30 text-state-success hover:bg-state-success-dim text-xs h-8"
              >
                Mark Present
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isLoading || !isStartedOrCompleted}
                onClick={() => handleBulkUpdate("ABSENT")}
                className="border-state-error/30 text-state-error hover:bg-state-error-dim text-xs h-8"
              >
                Mark Absent
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedIds(new Set())}
                className="text-xs text-copy-muted h-8"
              >
                Deselect
              </Button>
            </div>
          </div>
        )}

        {/* Attendees Table */}
        {filteredAttendees.length === 0 ? (
          <div className="py-12 text-center text-xs text-copy-muted space-y-1">
            <Users className="size-8 mx-auto text-copy-muted/60 mb-2" />
            <p className="font-medium text-copy-primary">No attendees found</p>
            <p>No records match your search or filter criteria.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-surface-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-subtle/70 border-b border-surface-border text-copy-muted uppercase text-[11px] font-semibold tracking-wider">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        disabled={!isStartedOrCompleted}
                        className="text-copy-muted hover:text-copy-primary focus:outline-none"
                      >
                        {isAllSelected ? (
                          <CheckSquare className="size-4 text-brand" />
                        ) : (
                          <Square className="size-4" />
                        )}
                      </button>
                    </th>
                    <th className="p-3">Attendee</th>
                    <th className="p-3">Student ID</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Checked In</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border bg-surface">
                  {filteredAttendees.map((att) => {
                    const isSelected = selectedIds.has(att.id);
                    const isCancelled = att.status === "CANCELLED";

                    return (
                      <tr
                        key={att.id}
                        className={`hover:bg-subtle/30 transition-colors ${
                          isSelected ? "bg-brand/5" : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-3 text-center">
                          {!isCancelled && (
                            <button
                              type="button"
                              onClick={() => toggleSelectOne(att.id)}
                              disabled={!isStartedOrCompleted}
                              className="text-copy-muted hover:text-copy-primary focus:outline-none"
                            >
                              {isSelected ? (
                                <CheckSquare className="size-4 text-brand" />
                              ) : (
                                <Square className="size-4" />
                              )}
                            </button>
                          )}
                        </td>

                        {/* Name & Email */}
                        <td className="p-3">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-copy-primary block">
                              {att.user.name}
                            </span>
                            <span className="text-[11px] text-copy-muted block">
                              {att.user.email}
                            </span>
                          </div>
                        </td>

                        {/* Student ID */}
                        <td className="p-3 font-mono text-[11px] text-copy-secondary">
                          {att.user.studentId || "—"}
                        </td>

                        {/* Status Badge */}
                        <td className="p-3">
                          {att.status === "PRESENT" && (
                            <Badge
                              variant="outline"
                              className="bg-state-success-dim text-state-success border-state-success/30 font-semibold text-[11px] gap-1"
                            >
                              <Check className="size-3" />
                              Present
                            </Badge>
                          )}
                          {att.status === "ABSENT" && (
                            <Badge
                              variant="outline"
                              className="bg-state-error-dim text-state-error border-state-error/30 font-semibold text-[11px] gap-1"
                            >
                              <X className="size-3" />
                              Absent
                            </Badge>
                          )}
                          {att.status === "REGISTERED" && (
                            <Badge
                              variant="outline"
                              className="bg-subtle text-copy-secondary border-surface-border text-[11px]"
                            >
                              Registered
                            </Badge>
                          )}
                          {att.status === "CANCELLED" && (
                            <Badge
                              variant="outline"
                              className="bg-subtle text-copy-muted border-surface-border text-[11px]"
                            >
                              Cancelled
                            </Badge>
                          )}
                        </td>

                        {/* Checked In At */}
                        <td className="p-3 text-copy-muted text-[11px]">
                          {att.checkedInAt ? formatDateTime(att.checkedInAt) : "—"}
                        </td>

                        {/* Row Actions */}
                        <td className="p-3 text-right">
                          {isCancelled ? (
                            <span className="text-[11px] text-copy-muted">
                              Cancelled
                            </span>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              {att.status !== "PRESENT" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={isLoading || !isStartedOrCompleted}
                                  onClick={() => handleSingleUpdate(att.id, "PRESENT")}
                                  className="h-7 px-2.5 text-[11px] border-surface-border hover:bg-state-success-dim hover:text-state-success hover:border-state-success/30"
                                >
                                  Present
                                </Button>
                              ) : null}

                              {att.status !== "ABSENT" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={isLoading || !isStartedOrCompleted}
                                  onClick={() => handleSingleUpdate(att.id, "ABSENT")}
                                  className="h-7 px-2.5 text-[11px] border-surface-border hover:bg-state-error-dim hover:text-state-error hover:border-state-error/30"
                                >
                                  Absent
                                </Button>
                              ) : null}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
