"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  History,
  Code,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";

export interface AdminAuditItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorId: string | null;
  actorName: string;
  actorEmail: string | null;
  clubId: string | null;
  metadata: any;
  createdAt: string | Date;
  description: string;
}

interface AdminAuditViewerProps {
  initialLogs: AdminAuditItem[];
  nextCursor: string | null;
}

const ACTION_CATEGORIES = [
  { label: "All Action Categories", value: "ALL" },
  { label: "Club Governance (club.)", value: "club." },
  { label: "Review & Approvals (approval.)", value: "approval." },
  { label: "Memberships (membership.)", value: "membership." },
  { label: "Events & Sessions (event.)", value: "event." },
  { label: "Attendance (attendance.)", value: "attendance." },
  { label: "Announcements (announcement.)", value: "announcement." },
  { label: "Objectives (objective.)", value: "objective." },
  { label: "Reports & Exports (report.)", value: "report." },
  { label: "Users & Roles (user.)", value: "user." },
];

export function AdminAuditViewer({
  initialLogs,
  nextCursor,
}: AdminAuditViewerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentAction = searchParams.get("action") || "ALL";
  const currentEntityType = searchParams.get("entityType") || "";
  const currentFrom = searchParams.get("from") || "";
  const currentTo = searchParams.get("to") || "";
  const currentQ = searchParams.get("q") || "";

  const [selectedLog, setSelectedLog] = useState<AdminAuditItem | null>(null);
  const [copied, setCopied] = useState(false);

  // Filter form state
  const [actionCategory, setActionCategory] = useState(currentAction);
  const [entityType, setEntityType] = useState(currentEntityType);
  const [from, setFrom] = useState(currentFrom);
  const [to, setTo] = useState(currentTo);
  const [q, setQ] = useState(currentQ);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (actionCategory && actionCategory !== "ALL") params.set("action", actionCategory);
    if (entityType.trim()) params.set("entityType", entityType.trim());
    if (from.trim()) params.set("from", from.trim());
    if (to.trim()) params.set("to", to.trim());
    if (q.trim()) params.set("q", q.trim());
    router.push(`/admin/audit?${params.toString()}`);
  };

  const resetFilters = () => {
    setActionCategory("ALL");
    setEntityType("");
    setFrom("");
    setTo("");
    setQ("");
    router.push("/admin/audit");
  };

  const handleCopyJson = () => {
    if (!selectedLog) return;
    navigator.clipboard.writeText(JSON.stringify(selectedLog.metadata, null, 2));
    setCopied(true);
    toast.success("Metadata copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const getActionTone = (action: string) => {
    if (action.startsWith("club.")) return "bg-brand/10 text-brand border-brand/20";
    if (action.startsWith("event.")) return "bg-state-info-dim text-state-info border-state-info/20";
    if (action.startsWith("approval.")) return "bg-state-warning-dim text-state-warning border-state-warning/20";
    if (action.startsWith("membership.")) return "bg-state-success-dim text-state-success border-state-success/20";
    if (action.startsWith("report.")) return "bg-subtle text-copy-secondary border-surface-border";
    return "bg-subtle text-copy-primary border-surface-border";
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="bg-surface p-4 rounded-2xl border border-surface-border shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Action Category Select */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-copy-muted block mb-1">
              Action Category
            </label>
            <Select value={actionCategory} onValueChange={setActionCategory}>
              <SelectTrigger className="h-9 text-xs bg-background border-surface-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTION_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value} className="text-xs">
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Entity Type Input */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-copy-muted block mb-1">
              Entity Type
            </label>
            <Input
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              placeholder="e.g. CLUB, EVENT, USER..."
              className="h-9 text-xs bg-background border-surface-border"
            />
          </div>

          {/* Date Range: From */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-copy-muted block mb-1">
              From Date
            </label>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-9 text-xs bg-background border-surface-border"
            />
          </div>

          {/* Date Range: To */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-copy-muted block mb-1">
              To Date
            </label>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-9 text-xs bg-background border-surface-border"
            />
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between pt-2 border-t border-surface-border">
          <span className="text-xs text-copy-muted">
            Displaying {initialLogs.length} audit entries
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="h-8 text-xs gap-1 border-surface-border"
            >
              <RotateCcw className="size-3 text-copy-muted" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={applyFilters}
              className="h-8 text-xs gap-1 bg-brand text-white hover:bg-brand/90"
            >
              <Filter className="size-3" />
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Audit Log Table (Desktop) */}
      <div className="hidden md:block rounded-2xl border border-surface-border bg-surface overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Timestamp</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-xs text-copy-muted">
                  No audit log entries match the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              initialLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs text-copy-muted whitespace-nowrap">
                    {formatDateTime(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-semibold text-copy-primary">
                      {log.actorName}
                    </div>
                    {log.actorEmail && (
                      <div className="text-[11px] text-copy-muted">{log.actorEmail}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`font-mono text-[11px] px-2 py-0.5 border ${getActionTone(log.action)}`}
                    >
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="font-semibold text-copy-secondary">
                      {log.entityType}
                    </span>
                    <span className="block font-mono text-[10px] text-copy-muted truncate max-w-[120px]">
                      {log.entityId}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-copy-secondary max-w-sm">
                    {log.description}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedLog(log)}
                      className="h-7 px-2 text-xs gap-1 border-surface-border"
                    >
                      <Code className="size-3 text-copy-muted" />
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Cards View (Mobile) */}
      <div className="md:hidden space-y-3">
        {initialLogs.length === 0 ? (
          <div className="text-center py-12 text-xs text-copy-muted bg-surface rounded-2xl border border-surface-border p-6">
            No audit log entries match the selected filters.
          </div>
        ) : (
          initialLogs.map((log) => (
            <div
              key={log.id}
              className="rounded-2xl border border-surface-border bg-surface p-4 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <Badge
                  variant="outline"
                  className={`font-mono text-[10px] px-2 py-0.5 border ${getActionTone(log.action)}`}
                >
                  {log.action}
                </Badge>
                <span className="text-[11px] font-mono text-copy-muted">
                  {formatDateTime(log.createdAt)}
                </span>
              </div>

              <div className="text-xs text-copy-primary font-medium">
                {log.description}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-surface-border text-xs text-copy-muted">
                <span>By: <strong className="text-copy-primary">{log.actorName}</strong></span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedLog(log)}
                  className="h-7 px-2 text-xs gap-1"
                >
                  <Code className="size-3" />
                  JSON
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cursor Pagination Navigation */}
      {nextCursor && (
        <div className="flex items-center justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("cursor", nextCursor);
              router.push(`/admin/audit?${params.toString()}`);
            }}
            className="text-xs gap-1.5"
          >
            <span>Load Next Page</span>
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Metadata Inspection Dialog */}
      <Dialog
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-6 text-sm">
              <span className="font-mono text-xs">
                Audit Event: {selectedLog?.action}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyJson}
                className="h-7 text-xs gap-1"
              >
                {copied ? <Check className="size-3 text-state-success" /> : <Copy className="size-3" />}
                Copy JSON
              </Button>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Recorded on {selectedLog && formatDateTime(selectedLog.createdAt)} by {selectedLog?.actorName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-subtle p-2">
                <span className="text-[10px] text-copy-muted uppercase block font-semibold">
                  Entity Type & ID
                </span>
                <span className="font-mono text-xs text-copy-primary">
                  {selectedLog?.entityType}: {selectedLog?.entityId}
                </span>
              </div>
              <div className="rounded-lg bg-subtle p-2">
                <span className="text-[10px] text-copy-muted uppercase block font-semibold">
                  Actor ID
                </span>
                <span className="font-mono text-xs text-copy-primary truncate block">
                  {selectedLog?.actorId || "System"}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-copy-muted block mb-1">
                Event Metadata Payload
              </span>
              <pre className="p-3 bg-subtle rounded-xl text-xs font-mono text-copy-primary overflow-x-auto max-h-[300px]">
                {JSON.stringify(selectedLog?.metadata ?? {}, null, 2)}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
