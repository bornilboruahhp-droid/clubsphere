"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Building2, Users, History } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_TABS = [
  {
    label: "Analytics & Health",
    href: "/admin",
    icon: BarChart3,
  },
  {
    label: "Club Controls",
    href: "/admin/clubs",
    icon: Building2,
  },
  {
    label: "Users & Roles",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Audit Logs",
    href: "/admin/audit",
    icon: History,
  },
];

export function AdminNavTabs() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 p-1 bg-subtle rounded-xl border border-surface-border w-fit">
      {NAV_TABS.map((tab) => {
        const isActive =
          tab.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all",
              isActive
                ? "bg-surface text-copy-primary shadow-xs font-semibold"
                : "text-copy-muted hover:text-copy-primary hover:bg-surface/50"
            )}
          >
            <tab.icon className="size-3.5" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
