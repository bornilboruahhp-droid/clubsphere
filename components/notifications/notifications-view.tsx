"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Check,
  ExternalLink,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/layout/empty-state";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface SerializedNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsViewProps {
  initialNotifications: SerializedNotification[];
}

export function NotificationsView({ initialNotifications }: NotificationsViewProps) {
  const router = useRouter();
  const [items, setItems] = React.useState<SerializedNotification[]>(initialNotifications);
  const [filter, setFilter] = React.useState<"all" | "unread">("all");
  const [markingAll, setMarkingAll] = React.useState<boolean>(false);

  // Compute unread count
  const unreadCount = React.useMemo(
    () => items.filter((n) => !n.readAt).length,
    [items]
  );

  // Filter items
  const displayedItems = React.useMemo(() => {
    if (filter === "unread") {
      return items.filter((n) => !n.readAt);
    }
    return items;
  }, [items, filter]);

  // Mark single as read
  const handleMarkOne = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const now = new Date().toISOString();

    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: n.readAt ?? now } : n))
    );

    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      window.dispatchEvent(new CustomEvent("notifications:refresh"));
    } catch (err) {
      console.error("[NotificationsView] Failed to mark read:", err);
    }
  };

  // Click on notification
  const handleItemClick = async (item: SerializedNotification) => {
    if (!item.readAt) {
      const now = new Date().toISOString();
      setItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, readAt: n.readAt ?? now } : n))
      );

      try {
        await fetch(`/api/notifications/${item.id}/read`, { method: "POST" });
        window.dispatchEvent(new CustomEvent("notifications:refresh"));
      } catch (err) {
        console.error("[NotificationsView] Failed to mark read:", err);
      }
    }

    if (item.href) {
      router.push(item.href);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);

    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? now })));

    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      window.dispatchEvent(new CustomEvent("notifications:refresh"));
    } catch (err) {
      console.error("[NotificationsView] Failed to mark all as read:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar: Filters & Mark-All-Read */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-4">
        {/* Filter buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className={cn(
              "text-xs font-medium rounded-xl h-8",
              filter === "all"
                ? "bg-brand text-brand-foreground hover:bg-brand/90"
                : "border-surface-border text-copy-secondary hover:text-copy-primary hover:bg-subtle"
            )}
          >
            All
            <span className="ml-1.5 rounded-full bg-surface/30 px-1.5 py-0.2 text-[10px] font-semibold">
              {items.length}
            </span>
          </Button>

          <Button
            variant={filter === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("unread")}
            className={cn(
              "text-xs font-medium rounded-xl h-8",
              filter === "unread"
                ? "bg-brand text-brand-foreground hover:bg-brand/90"
                : "border-surface-border text-copy-secondary hover:text-copy-primary hover:bg-subtle"
            )}
          >
            Unread
            {unreadCount > 0 && (
              <span className="ml-1.5 rounded-full bg-brand-foreground text-brand px-1.5 py-0.2 text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </Button>
        </div>

        {/* Mark all as read button */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markingAll || unreadCount === 0}
            className="text-xs h-8 rounded-xl border-surface-border text-copy-secondary hover:text-copy-primary hover:bg-subtle disabled:opacity-50"
          >
            <CheckCheck className="size-3.5 mr-1.5 text-brand" />
            Mark all as read
          </Button>
        </div>
      </div>

      {/* Notifications List or Empty State */}
      {displayedItems.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={filter === "unread" ? "No unread notifications" : "No notifications yet"}
          description={
            filter === "unread"
              ? "You have caught up with all your unread notifications."
              : "When you receive announcements, event alerts, or club notices, they'll show up here."
          }
          action={
            filter === "unread" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilter("all")}
                className="text-xs rounded-xl border-surface-border"
              >
                View all notifications
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="divide-y divide-surface-border rounded-2xl border border-surface-border bg-surface overflow-hidden">
          {displayedItems.map((item) => {
            const isUnread = !item.readAt;

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleItemClick(item);
                  }
                }}
                className={cn(
                  "group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 md:p-5 text-left transition-colors cursor-pointer select-none",
                  isUnread
                    ? "bg-brand/5 hover:bg-brand/10"
                    : "hover:bg-subtle/50"
                )}
              >
                {/* Left: Indicator & Content */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* Unread indicator dot */}
                  <div className="pt-1 shrink-0">
                    <div
                      className={cn(
                        "size-2.5 rounded-full transition-transform",
                        isUnread ? "bg-brand scale-100" : "bg-transparent scale-0"
                      )}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4
                        className={cn(
                          "text-sm leading-snug",
                          isUnread
                            ? "font-semibold text-copy-primary"
                            : "font-medium text-copy-secondary"
                        )}
                      >
                        {item.title}
                      </h4>
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 h-4 uppercase tracking-wider bg-subtle text-copy-muted border-none"
                      >
                        {item.type.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    {item.body && (
                      <p className="text-xs text-copy-secondary leading-relaxed mt-1">
                        {item.body}
                      </p>
                    )}

                    <span className="block text-[11px] text-copy-muted mt-2 font-mono">
                      {formatRelative(item.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {isUnread && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleMarkOne(e, item.id)}
                      title="Mark as read"
                      className="h-8 px-2.5 text-xs text-copy-secondary hover:text-copy-primary hover:bg-subtle"
                    >
                      <Check className="size-3.5 mr-1" />
                      Mark read
                    </Button>
                  )}

                  {item.href && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="h-8 px-2.5 text-xs border-surface-border text-copy-secondary hover:text-copy-primary hover:bg-subtle"
                    >
                      <Link href={item.href} onClick={(e) => e.stopPropagation()}>
                        Open
                        <ExternalLink className="size-3 ml-1" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
