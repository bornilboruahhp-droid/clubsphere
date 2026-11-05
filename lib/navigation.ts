import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardCheck,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

export type PlatformRole = "STUDENT" | "ADVISOR" | "ADMIN";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: PlatformRole[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Clubs",
    href: "/clubs",
    icon: Users,
  },
  {
    label: "Events",
    href: "/events",
    icon: Calendar,
  },
  {
    label: "Reviews",
    href: "/reviews",
    icon: ClipboardCheck,
    roles: ["ADVISOR", "ADMIN"],
  },
  {
    label: "Admin",
    href: "/admin",
    icon: ShieldAlert,
    roles: ["ADMIN"],
  },
];

/**
 * Returns navigation items accessible to the given platform role.
 */
export function getNavItems(role: PlatformRole = "STUDENT"): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}
