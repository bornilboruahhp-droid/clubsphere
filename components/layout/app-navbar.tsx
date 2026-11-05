"use client";

import * as React from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  PanelLeftClose,
  PanelLeftOpen,
  GraduationCap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NotificationBell } from "@/components/layout/notification-bell";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { PlatformRole } from "@/lib/navigation";

export interface AppNavbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  role?: PlatformRole;
  onRoleChange?: (role: PlatformRole) => void;
}

export function AppNavbar({
  sidebarOpen,
  onToggleSidebar,
  role = "STUDENT",
  onRoleChange,
}: AppNavbarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-surface-border bg-surface/95 backdrop-blur px-4 md:px-6">
      {/* Left: Sidebar Toggle & Brand */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          className="text-copy-secondary hover:text-copy-primary hover:bg-subtle"
        >
          {sidebarOpen ? (
            <PanelLeftClose className="size-5" />
          ) : (
            <PanelLeftOpen className="size-5" />
          )}
        </Button>

        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 font-semibold text-lg text-copy-primary tracking-tight transition-opacity hover:opacity-90"
        >
          <div className="flex size-8 items-center justify-center rounded-xl bg-brand text-brand-foreground">
            <GraduationCap className="size-5" />
          </div>
          <span>ClubSphere</span>
        </Link>
      </div>

      {/* Right: Mock Role Switcher, Notifications, Theme Toggle, User Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mock Role Switcher for spec 02 testing */}
        {onRoleChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex text-xs font-mono h-8 border-surface-border bg-subtle/50 text-copy-secondary"
              >
                Role: <span className="font-semibold text-brand ml-1">{role}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-surface-border bg-elevated">
              <DropdownMenuLabel className="text-xs text-copy-muted">
                Mock Platform Role
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-surface-border" />
              <DropdownMenuGroup>
                {(["STUDENT", "ADVISOR", "ADMIN"] as PlatformRole[]).map((r) => (
                  <DropdownMenuItem
                    key={r}
                    onClick={() => onRoleChange(r)}
                    className={r === role ? "font-semibold text-brand bg-brand-dim" : ""}
                  >
                    {r}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Notification Bell from Spec 09 */}
        <NotificationBell />

        {/* Theme Toggle from Spec 01 */}
        <ThemeToggle />

        {/* Clerk UserButton */}
        <div className="flex items-center">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "size-8",
                userButtonPopoverCard:
                  "border border-surface-border bg-elevated shadow-none rounded-2xl",
                userButtonPopoverActionButton:
                  "text-copy-primary hover:bg-subtle",
                userButtonPopoverActionButtonText: "text-copy-primary",
                userButtonPopoverFooter: "hidden",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
