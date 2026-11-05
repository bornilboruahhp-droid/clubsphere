import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-2xl border border-dashed border-surface-border bg-surface/50",
        className
      )}
    >
      <div className="flex items-center justify-center size-14 rounded-2xl bg-subtle text-copy-muted mb-4">
        <Icon className="size-8" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-medium text-copy-primary mb-1">{title}</h3>
      <p className="text-sm text-copy-secondary max-w-sm mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
