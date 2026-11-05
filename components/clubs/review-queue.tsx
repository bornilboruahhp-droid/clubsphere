import * as React from "react";
import { ClipboardCheck, Calendar, User, Building2 } from "lucide-react";
import type { ReviewQueueClub } from "@/lib/data/reviews";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/layout/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReviewDialog } from "@/components/clubs/review-dialog";

export interface ReviewQueueProps {
  clubs: ReviewQueueClub[];
  role: "ADVISOR" | "ADMIN";
}

export function ReviewQueue({ clubs, role }: ReviewQueueProps) {
  if (clubs.length === 0) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="Review queue is clear"
        description={
          role === "ADVISOR"
            ? "You currently have no club proposals awaiting your faculty sponsorship review."
            : "There are currently no club charter submissions awaiting final administrative review."
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-2xl border border-surface-border bg-surface overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-subtle/50">
            <TableRow className="border-surface-border hover:bg-transparent">
              <TableHead className="font-semibold text-xs text-copy-primary">
                Club Organization
              </TableHead>
              <TableHead className="font-semibold text-xs text-copy-primary">
                Proposer
              </TableHead>
              <TableHead className="font-semibold text-xs text-copy-primary">
                Department
              </TableHead>
              <TableHead className="font-semibold text-xs text-copy-primary">
                Submitted
              </TableHead>
              <TableHead className="font-semibold text-xs text-copy-primary">
                Stage
              </TableHead>
              <TableHead className="text-right font-semibold text-xs text-copy-primary pr-6">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-surface-border">
            {clubs.map((club) => {
              const currentStage =
                club.approvals.find((a) => a.decision === "PENDING")?.stage ||
                (role === "ADMIN" ? "ADMIN" : "ADVISOR");

              return (
                <TableRow
                  key={club.id}
                  className="border-surface-border hover:bg-subtle/40 transition-colors"
                >
                  <TableCell className="font-medium text-copy-primary py-4">
                    <div>
                      <span className="font-semibold block">{club.name}</span>
                      <span className="text-xs text-copy-muted line-clamp-1 max-w-xs">
                        {club.description}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-copy-secondary py-4">
                    <span className="font-medium text-copy-primary block">
                      {club.proposer.name}
                    </span>
                    <span className="text-copy-muted">{club.proposer.email}</span>
                  </TableCell>

                  <TableCell className="text-xs text-copy-secondary py-4">
                    {club.proposer.department || "Undeclared"}
                  </TableCell>

                  <TableCell className="text-xs text-copy-muted font-mono py-4">
                    {formatDate(club.createdAt)}
                  </TableCell>

                  <TableCell className="py-4">
                    <Badge
                      variant="outline"
                      className="bg-state-warning-dim text-state-warning border-state-warning/30 text-[11px] font-medium"
                    >
                      {currentStage === "ADVISOR" ? "Advisor Review" : "Admin Review"}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right py-4 pr-6">
                    <ReviewDialog club={club} role={role} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Stacked Cards View */}
      <div className="md:hidden space-y-3">
        {clubs.map((club) => {
          const currentStage =
            club.approvals.find((a) => a.decision === "PENDING")?.stage ||
            (role === "ADMIN" ? "ADMIN" : "ADVISOR");

          return (
            <div
              key={club.id}
              className="rounded-2xl border border-surface-border bg-surface p-5 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm text-copy-primary">
                    {club.name}
                  </h4>
                  <p className="text-xs text-copy-muted line-clamp-2">
                    {club.description}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="bg-state-warning-dim text-state-warning border-state-warning/30 text-[10px] shrink-0 font-medium"
                >
                  {currentStage === "ADVISOR" ? "Advisor" : "Admin"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-surface-border py-2.5">
                <div className="space-y-0.5">
                  <span className="text-[11px] text-copy-muted flex items-center gap-1">
                    <User className="size-3 text-copy-muted" />
                    Proposer
                  </span>
                  <span className="font-medium text-copy-primary block truncate">
                    {club.proposer.name}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[11px] text-copy-muted flex items-center gap-1">
                    <Building2 className="size-3 text-copy-muted" />
                    Department
                  </span>
                  <span className="text-copy-secondary block truncate">
                    {club.proposer.department || "Undeclared"}
                  </span>
                </div>

                <div className="space-y-0.5 col-span-2 pt-1">
                  <span className="text-[11px] text-copy-muted flex items-center gap-1">
                    <Calendar className="size-3 text-copy-muted" />
                    Submitted
                  </span>
                  <span className="text-copy-muted font-mono">
                    {formatDate(club.createdAt)}
                  </span>
                </div>
              </div>

              <div className="pt-1 flex justify-end">
                <ReviewDialog club={club} role={role} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
