import * as React from "react";
import type { ClubStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface StatusBadgeProps {
  status: ClubStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  ClubStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Pending Approval",
    className: "bg-state-warning-dim text-state-warning border-state-warning/30",
  },
  ACTIVE: {
    label: "Active",
    className: "bg-state-success-dim text-state-success border-state-success/30",
  },
  SUSPENDED: {
    label: "Suspended",
    className: "bg-state-error-dim text-state-error border-state-error/30",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-state-error-dim text-state-error border-state-error/30",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-subtle text-copy-muted border-surface-border",
  };

  return (
    <Badge
      variant="outline"
      className={cn("px-2.5 py-0.5 text-xs font-medium border", config.className, className)}
    >
      <span className="size-1.5 rounded-full mr-1.5 bg-current" />
      {config.label}
    </Badge>
  );
}
