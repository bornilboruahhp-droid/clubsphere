"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, ExternalLink, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState<number>(0);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [markingAll, setMarkingAll] = React.useState<boolean>(false);

  // Fetch unread count
  const fetchUnreadCount = React.useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread-count");
      if (res.ok) {
        const json = await res.json();
        setUnreadCount(json.data.count ?? 0);
      }
    } catch (err) {
      console.error("[NotificationBell] Failed to fetch unread count:", err);
    }
  }, []);

  // Fetch recent notifications when dropdown opens
  const fetchRecent = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=10");
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.data ?? []);
      }
    } catch (err) {
      console.error("[NotificationBell] Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Polling setup: on mount, every 60s, and on window focus
  React.useEffect(() => {
    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 60000);

    const onFocus = () => {
      fetchUnreadCount();
    };

    const onRefresh = () => {
      fetchUnreadCount();
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("notifications:refresh", onRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("notifications:refresh", onRefresh);
    };
  }, [fetchUnreadCount]);

  // When dropdown opens, fetch latest 10
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      fetchRecent();
      fetchUnreadCount();
    }
  };

  // Mark single notification as read
  const handleItemClick = async (item: NotificationItem) => {
    if (!item.readAt) {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await fetch(`/api/notifications/${item.id}/read`, { method: "POST" });
        window.dispatchEvent(new CustomEvent("notifications:refresh"));
      } catch (err) {
        console.error("[NotificationBell] Failed to mark read:", err);
      }
    }

    if (item.href) {
      setOpen(false);
      router.push(item.href);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);

    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? now })));
    setUnreadCount(0);

    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      window.dispatchEvent(new CustomEvent("notifications:refresh"));
    } catch (err) {
      console.error("[NotificationBell] Failed to mark all as read:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative text-copy-secondary hover:text-copy-primary hover:bg-subtle"
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-foreground shadow-sm"
              aria-label={`${unreadCount} unread notifications`}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 sm:w-96 border-surface-border bg-elevated p-0 shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-copy-primary">Notifications</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="h-7 text-xs text-copy-secondary hover:text-copy-primary"
            >
              <CheckCheck className="size-3.5 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-surface-border/50">
          {loading && notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-copy-muted">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="flex size-10 items-center justify-center rounded-xl bg-subtle text-copy-muted mb-2">
                <Inbox className="size-5" />
              </div>
              <p className="text-sm font-medium text-copy-primary">No notifications</p>
              <p className="text-xs text-copy-muted mt-0.5">You're all caught up!</p>
            </div>
          ) : (
            notifications.map((item) => {
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
                    "group flex items-start gap-3 p-3.5 text-left transition-colors cursor-pointer select-none",
                    isUnread
                      ? "bg-brand/5 hover:bg-brand/10"
                      : "hover:bg-subtle/70"
                  )}
                >
                  {/* Unread indicator dot */}
                  <div className="pt-1.5 shrink-0">
                    <div
                      className={cn(
                        "size-2 rounded-full",
                        isUnread ? "bg-brand" : "bg-transparent"
                      )}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-xs font-medium leading-snug line-clamp-1",
                        isUnread ? "text-copy-primary font-semibold" : "text-copy-secondary"
                      )}
                    >
                      {item.title}
                    </p>
                    {item.body && (
                      <p className="text-xs text-copy-muted line-clamp-2 mt-0.5">
                        {item.body}
                      </p>
                    )}
                    <span className="block text-[11px] text-copy-muted mt-1.5 font-mono">
                      {formatRelative(item.createdAt)}
                    </span>
                  </div>

                  {/* External link indicator */}
                  {item.href && (
                    <ExternalLink className="size-3.5 text-copy-muted shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-surface-border p-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="w-full justify-center text-xs text-copy-secondary hover:text-copy-primary hover:bg-subtle"
            onClick={() => setOpen(false)}
          >
            <Link href="/notifications">View all notifications</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
