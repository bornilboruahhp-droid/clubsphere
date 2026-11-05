"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap } from "lucide-react";

import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export interface AppSidebarProps {
  navItems: NavItem[];
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  desktopCollapsed?: boolean;
}

export function AppSidebar({
  navItems,
  mobileOpen,
  onMobileOpenChange,
  desktopCollapsed = false,
}: AppSidebarProps) {
  const pathname = usePathname();

  const renderNavLinks = (onItemClick?: () => void) => (
    <nav className="flex flex-col gap-1.5 p-3">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-brand-dim text-brand font-semibold"
                : "text-copy-secondary hover:bg-subtle hover:text-copy-primary",
              desktopCollapsed && "md:justify-center md:px-2"
            )}
            title={desktopCollapsed ? item.label : undefined}
          >
            <Icon className="size-5 shrink-0" strokeWidth={isActive ? 2 : 1.75} />
            <span className={cn(desktopCollapsed && "md:hidden")}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile Drawer (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="w-72 p-0 border-r border-surface-border bg-surface">
          <SheetHeader className="p-4 border-b border-surface-border">
            <SheetTitle className="flex items-center gap-2.5 text-left text-lg font-semibold tracking-tight text-copy-primary">
              <div className="flex size-8 items-center justify-center rounded-xl bg-brand text-brand-foreground">
                <GraduationCap className="size-5" />
              </div>
              <span>ClubSphere</span>
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            {renderNavLinks(() => onMobileOpenChange(false))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Persistent Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-surface-border bg-surface transition-all duration-200 shrink-0",
          desktopCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex-1 overflow-y-auto py-3">
          {renderNavLinks()}
        </div>
      </aside>
    </>
  );
}
