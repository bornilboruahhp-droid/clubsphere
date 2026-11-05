import type { ObjectiveStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

interface ObjectiveStatusBadgeProps {
  status: ObjectiveStatus;
  className?: string;
}

export function ObjectiveStatusBadge({ status, className }: ObjectiveStatusBadgeProps) {
  switch (status) {
    case "PLANNED":
      return (
        <Badge
          variant="outline"
          className={`bg-subtle text-copy-secondary border-surface-border text-[11px] font-medium px-2 py-0.5 ${
            className || ""
          }`}
        >
          Planned
        </Badge>
      );
    case "IN_PROGRESS":
      return (
        <Badge
          variant="outline"
          className={`bg-state-info-dim text-state-info border-state-info/30 text-[11px] font-semibold px-2 py-0.5 uppercase tracking-wider ${
            className || ""
          }`}
        >
          In Progress
        </Badge>
      );
    case "ACHIEVED":
      return (
        <Badge
          variant="outline"
          className={`bg-state-success-dim text-state-success border-state-success/30 text-[11px] font-semibold px-2 py-0.5 uppercase tracking-wider ${
            className || ""
          }`}
        >
          Achieved
        </Badge>
      );
    case "DROPPED":
      return (
        <Badge
          variant="outline"
          className={`bg-state-error-dim text-state-error border-state-error/30 text-[11px] font-semibold px-2 py-0.5 uppercase tracking-wider ${
            className || ""
          }`}
        >
          Dropped
        </Badge>
      );
  }
}
