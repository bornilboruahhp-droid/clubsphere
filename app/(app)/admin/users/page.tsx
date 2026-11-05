import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlatformRole, ClubStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/get-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { AdminNavTabs } from "@/components/admin/admin-nav-tabs";
import {
  AdminUsersTable,
  AdminUserRow,
} from "@/components/admin/admin-users-table";

export const metadata: Metadata = {
  title: "User & Role Governance | ClubSphere Administration",
  description: "Campus-wide user directory, platform role assignments, and governance permissions.",
};

export default async function AdminUsersPage() {
  const user = await requireUser();

  if (user.role !== PlatformRole.ADMIN) {
    notFound();
  }

  const usersRaw = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      studentId: true,
      department: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          memberships: {
            where: { status: "ACTIVE" },
          },
          advisedClubs: {
            where: { status: { in: [ClubStatus.PENDING, ClubStatus.ACTIVE] } },
          },
        },
      },
    },
    orderBy: [{ role: "desc" }, { name: "asc" }],
  });

  const users: AdminUserRow[] = usersRaw.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    studentId: u.studentId,
    department: u.department,
    role: u.role,
    createdAt: u.createdAt,
    activeMembershipsCount: u._count.memberships,
    advisedClubsCount: u._count.advisedClubs,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="User & Platform Roles"
        description="Manage student access, faculty advisor appointments, and administrator privilege delegations across campus."
        actions={<AdminNavTabs />}
      />

      <AdminUsersTable initialUsers={users} currentAdminId={user.id} />
    </div>
  );
}
