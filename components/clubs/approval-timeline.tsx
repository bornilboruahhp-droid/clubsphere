import * as React from "react";
import { CheckCircle2, Clock, XCircle, Circle, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface ApprovalStageRecord {
  stage: "ADVISOR" | "ADMIN";
  decision: "PENDING" | "APPROVED" | "REJECTED";
  comment?: string | null;
  decidedAt?: Date | string | null;
  reviewer?: {
    name: string;
  } | null;
}

export interface ApprovalTimelineProps {
  approvals: ApprovalStageRecord[];
  className?: string;
}

interface StageDefinition {
  stage: "ADVISOR" | "ADMIN";
  title: string;
  description: string;
}

const STAGES: StageDefinition[] = [
  {
    stage: "ADVISOR",
    title: "Faculty Advisor Review",
    description: "Academic review, verification, and sponsorship by assigned advisor",
  },
  {
    stage: "ADMIN",
    title: "Administration Charter Review",
    description: "Platform governance and campus administrative approval",
  },
];

export function ApprovalTimeline({ approvals, className }: ApprovalTimelineProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-surface-border">
        {STAGES.map((def, idx) => {
          const record = approvals.find((a) => a.stage === def.stage);

          let status: "APPROVED" | "REJECTED" | "PENDING" | "UPCOMING" = "UPCOMING";
          if (record) {
            status = record.decision;
          }

          return (
            <div key={def.stage} className="relative group">
              {/* Timeline indicator node */}
              <div className="absolute -left-6 sm:-left-8 top-0 flex size-6 sm:size-8 items-center justify-center rounded-full bg-surface border-2 border-surface-border">
                {status === "APPROVED" && (
                  <CheckCircle2 className="size-4 sm:size-5 text-state-success" />
                )}
                {status === "REJECTED" && (
                  <XCircle className="size-4 sm:size-5 text-state-error" />
                )}
                {status === "PENDING" && (
                  <Clock className="size-4 sm:size-5 text-state-warning animate-pulse" />
                )}
                {status === "UPCOMING" && (
                  <Circle className="size-3.5 sm:size-4 text-copy-muted stroke-1" />
                )}
              </div>

              {/* Content Card */}
              <div className="rounded-xl border border-surface-border bg-surface p-4 sm:p-5 shadow-sm space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-medium text-copy-muted">
                      Stage {idx + 1}
                    </span>
                    <h4 className="text-sm font-semibold text-copy-primary">
                      {def.title}
                    </h4>
                  </div>

                  {status === "APPROVED" && (
                    <Badge
                      variant="outline"
                      className="bg-state-success-dim text-state-success border-state-success/30 text-xs font-medium"
                    >
                      Approved
                    </Badge>
                  )}
                  {status === "REJECTED" && (
                    <Badge
                      variant="outline"
                      className="bg-state-error-dim text-state-error border-state-error/30 text-xs font-medium"
                    >
                      Rejected
                    </Badge>
                  )}
                  {status === "PENDING" && (
                    <Badge
                      variant="outline"
                      className="bg-state-warning-dim text-state-warning border-state-warning/30 text-xs font-medium"
                    >
                      Pending Review
                    </Badge>
                  )}
                  {status === "UPCOMING" && (
                    <Badge
                      variant="outline"
                      className="bg-subtle text-copy-muted border-surface-border text-xs font-medium"
                    >
                      Upcoming
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-copy-secondary leading-relaxed">
                  {def.description}
                </p>

                {/* Review details */}
                {record && record.decidedAt && (
                  <div className="pt-2 border-t border-surface-border flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-copy-muted">
                    {record.reviewer?.name && (
                      <span>
                        Reviewed by <strong className="text-copy-primary">{record.reviewer.name}</strong>
                      </span>
                    )}
                    <span>
                      Decided on {formatDateTime(record.decidedAt)}
                    </span>
                  </div>
                )}

                {/* Reviewer Comment Callout */}
                {record?.comment && (
                  <div className="mt-3 flex items-start gap-2.5 rounded-lg bg-subtle p-3 text-xs text-copy-primary border border-surface-border/60">
                    <MessageSquare className="size-4 text-copy-muted shrink-0 mt-0.5" />
                    <div className="space-y-0.5 min-w-0">
                      <span className="font-medium text-copy-secondary text-[11px] block">
                        Reviewer Note
                      </span>
                      <p className="italic text-copy-primary">{record.comment}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
