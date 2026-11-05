"use client";

import * as React from "react";
import { AppNavbar } from "@/components/layout/app-navbar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { getNavItems, type PlatformRole } from "@/lib/navigation";

export interface AppShellProps {
  children: React.ReactNode;
  initialRole?: PlatformRole;
}

export function AppShell({ children, initialRole = "STUDENT" }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = React.useState(false);

  const navItems = React.useMemo(() => getNavItems(initialRole), [initialRole]);

  const handleToggleSidebar = React.useCallback(() => {
    // Check if window is below md breakpoint
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobileOpen((prev) => !prev);
    } else {
      setDesktopCollapsed((prev) => !prev);
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-base text-copy-primary">
      <AppNavbar
        sidebarOpen={mobileOpen || !desktopCollapsed}
        onToggleSidebar={handleToggleSidebar}
        role={initialRole}
      />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar
          navItems={navItems}
          mobileOpen={mobileOpen}
          onMobileOpenChange={setMobileOpen}
          desktopCollapsed={desktopCollapsed}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="mx-auto max-w-6xl flex flex-col gap-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
