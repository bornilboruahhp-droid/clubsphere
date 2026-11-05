import type { EventStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

interface EventStatusBadgeProps {
  status: EventStatus;
  className?: string;
}

export function EventStatusBadge({ status, className }: EventStatusBadgeProps) {
  switch (status) {
    case "DRAFT":
      return (
        <Badge
          variant="outline"
          className={`bg-subtle text-copy-secondary border-surface-border text-[11px] font-medium px-2 py-0.5 ${
            className || ""
          }`}
        >
          Draft
        </Badge>
      );
    case "PUBLISHED":
      return (
        <Badge
          variant="outline"
          className={`bg-state-info-dim text-state-info border-state-info/30 text-[11px] font-semibold px-2 py-0.5 uppercase tracking-wider ${
            className || ""
          }`}
        >
          Published
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge
          variant="outline"
          className={`bg-state-error-dim text-state-error border-state-error/30 text-[11px] font-semibold px-2 py-0.5 uppercase tracking-wider ${
            className || ""
          }`}
        >
          Cancelled
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge
          variant="outline"
          className={`bg-state-success-dim text-state-success border-state-success/30 text-[11px] font-semibold px-2 py-0.5 uppercase tracking-wider ${
            className || ""
          }`}
        >
          Completed
        </Badge>
      );
  }
}
