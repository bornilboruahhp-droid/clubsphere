"use client";

import { useState } from "react";
import {
  History,
  Building2,
  Calendar,
  Users,
  ShieldCheck,
  Megaphone,
  Download,
  Award,
  ChevronRight,
  Clock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatRelative } from "@/lib/format";

export interface ClubHistoryItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorId: string | null;
  actorName: string;
  createdAt: string | Date;
  metadata: any;
  description: string;
}

interface ClubHistoryTabProps {
  clubId: string;
  initialEntries: ClubHistoryItem[];
  initialCursor: string | null;
}

export function ClubHistoryTab({
  clubId,
  initialEntries,
  initialCursor,
}: ClubHistoryTabProps) {
  const [entries, setEntries] = useState<ClubHistoryItem[]>(initialEntries);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const getActionIcon = (action: string) => {
    if (action.startsWith("club.")) return Building2;
    if (action.startsWith("event.")) return Calendar;
    if (action.startsWith("membership.")) return Users;
    if (action.startsWith("approval.")) return ShieldCheck;
    if (action.startsWith("announcement.")) return Megaphone;
    if (action.startsWith("report.")) return Download;
    if (action.startsWith("objective.")) return Award;
    return History;
  };

  const handleLoadMore = async () => {
    if (!cursor || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const res = await fetch(
        `/api/clubs/${clubId}/history?cursor=${cursor}&limit=25`
      );
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to load older activity");
      }

      setEntries((prev) => [...prev, ...json.data]);
      setCursor(json.pagination?.nextCursor ?? null);
    } catch (err: any) {
      toast.error(err.message || "Failed to load history.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="rounded-2xl border border-surface-border bg-surface p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-surface-border">
        <div>
          <h3 className="text-sm font-semibold text-copy-primary">
            Organization Activity History
          </h3>
          <p className="text-xs text-copy-muted">
            Chronological log of officer governance, member actions, and official events
          </p>
        </div>
        <Badge
          variant="outline"
          className="bg-subtle text-copy-secondary border-surface-border text-xs w-fit"
        >
          {entries.length} recorded events
        </Badge>
      </div>

      {/* Activity Timeline */}
      {entries.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <History className="size-8 text-copy-muted mx-auto" />
          <h4 className="text-xs font-semibold text-copy-primary">
            No Recorded History
          </h4>
          <p className="text-xs text-copy-muted max-w-xs mx-auto">
            Audit entries will record automatically as the organization conducts campus activities.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-surface-border">
          {entries.map((item) => {
            const IconComponent = getActionIcon(item.action);

            return (
              <div key={item.id} className="relative group">
                {/* Timeline Node Icon */}
                <div className="absolute -left-6 top-0.5 size-5 rounded-full bg-surface border-2 border-brand flex items-center justify-center shadow-xs">
                  <div className="size-1.5 rounded-full bg-brand" />
                </div>

                <div className="rounded-xl border border-surface-border/70 bg-subtle/30 p-3.5 space-y-1.5 hover:bg-subtle/60 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <span className="font-semibold text-copy-primary flex items-center gap-1.5">
                      <IconComponent className="size-3.5 text-brand shrink-0" />
                      {item.description}
                    </span>
                    <span className="text-[11px] font-mono text-copy-muted shrink-0 flex items-center gap-1">
                      <Clock className="size-3 text-copy-muted" />
                      {formatRelative(item.createdAt)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-copy-muted pt-1 border-t border-surface-border/50">
                    <span className="font-mono text-[10px]">
                      Action: {item.action}
                    </span>
                    <span>{formatDateTime(item.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More Button */}
      {cursor && (
        <div className="pt-2 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="text-xs gap-1.5 border-surface-border"
          >
            {isLoadingMore ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
            Load Older Activity
          </Button>
        </div>
      )}
    </div>
  );
}
