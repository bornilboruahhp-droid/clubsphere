"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Users,
  Search,
  ShieldCheck,
  ShieldAlert,
  GraduationCap,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { PlatformRole } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  studentId: string | null;
  department: string | null;
  role: PlatformRole;
  createdAt: string | Date;
  activeMembershipsCount: number;
  advisedClubsCount: number;
}

interface AdminUsersTableProps {
  initialUsers: AdminUserRow[];
  currentAdminId: string;
}

export function AdminUsersTable({
  initialUsers,
  currentAdminId,
}: AdminUsersTableProps) {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserRow[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Role change confirmation state
  const [pendingChange, setPendingChange] = useState<{
    user: AdminUserRow;
    newRole: PlatformRole;
  } | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase();
      const matchesSearch =
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.studentId && u.studentId.toLowerCase().includes(q)) ||
        (u.department && u.department.toLowerCase().includes(q));

      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const handleRoleChangeConfirm = async () => {
    if (!pendingChange) return;

    const { user, newRole } = pendingChange;
    setLoadingId(user.id);

    try {
      const res = await fetch(`/api/admin/users/${user.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to update role");
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      );

      toast.success(`Role for ${user.name} changed to ${newRole}.`);
      setPendingChange(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update role.");
      setPendingChange(null);
    } finally {
      setLoadingId(null);
    }
  };

  const getRoleBadge = (role: PlatformRole) => {
    switch (role) {
      case "ADMIN":
        return (
          <Badge
            variant="outline"
            className="bg-state-error-dim text-state-error border-state-error/20 font-semibold text-xs px-2.5 py-0.5 gap-1 uppercase tracking-wider"
          >
            <ShieldAlert className="size-3" />
            Admin
          </Badge>
        );
      case "ADVISOR":
        return (
          <Badge
            variant="outline"
            className="bg-brand/10 text-brand border-brand/20 font-semibold text-xs px-2.5 py-0.5 gap-1 uppercase tracking-wider"
          >
            <GraduationCap className="size-3" />
            Advisor
          </Badge>
        );
      case "STUDENT":
      default:
        return (
          <Badge
            variant="outline"
            className="bg-subtle text-copy-secondary border-surface-border font-medium text-xs px-2.5 py-0.5"
          >
            Student
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Role Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-4 rounded-2xl border border-surface-border shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-copy-muted pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, student ID..."
            className="pl-9 bg-background border-surface-border text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px] bg-background border-surface-border text-xs">
              <SelectValue placeholder="Role: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="STUDENT">Students Only</SelectItem>
              <SelectItem value="ADVISOR">Advisors Only</SelectItem>
              <SelectItem value="ADMIN">Admins Only</SelectItem>
            </SelectContent>
          </Select>

          <span className="text-xs text-copy-muted font-medium px-2">
            {filteredUsers.length} of {users.length} users
          </span>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-surface-border bg-surface overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Student ID</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Current Role</TableHead>
              <TableHead className="text-right">Active Clubs</TableHead>
              <TableHead className="text-right">Advised Clubs</TableHead>
              <TableHead className="w-[180px]">Change Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-xs text-copy-muted">
                  No users match the search and filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-semibold text-xs text-copy-primary">
                      {u.name}
                      {u.id === currentAdminId && (
                        <span className="ml-1.5 text-[10px] text-brand font-medium">
                          (You)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-copy-muted">{u.email}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-copy-secondary">
                    {u.studentId || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-copy-secondary">
                    {u.department || "—"}
                  </TableCell>
                  <TableCell>{getRoleBadge(u.role)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {u.activeMembershipsCount}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {u.advisedClubsCount > 0 ? (
                      <span className="text-brand font-semibold">
                        {u.advisedClubsCount}
                      </span>
                    ) : (
                      "0"
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={u.role}
                      onValueChange={(val: PlatformRole) => {
                        if (val !== u.role) {
                          setPendingChange({ user: u, newRole: val });
                        }
                      }}
                      disabled={loadingId === u.id}
                    >
                      <SelectTrigger className="h-8 text-xs bg-background border-surface-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STUDENT" className="text-xs">
                          Student
                        </SelectItem>
                        <SelectItem value="ADVISOR" className="text-xs">
                          Advisor
                        </SelectItem>
                        <SelectItem value="ADMIN" className="text-xs">
                          Administrator
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Role Change Confirmation Alert Dialog */}
      <AlertDialog
        open={!!pendingChange}
        onOpenChange={(open) => !open && setPendingChange(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-state-warning" />
              Confirm Platform Role Change
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the platform role for{" "}
              <strong>{pendingChange?.user.name}</strong> from{" "}
              <span className="font-semibold">{pendingChange?.user.role}</span> to{" "}
              <span className="font-semibold text-brand">
                {pendingChange?.newRole}
              </span>
              ?
              {pendingChange?.newRole === "ADMIN" && (
                <span className="block mt-2 text-state-warning font-medium">
                  This user will receive full institutional administration controls,
                  including club suspensions, role assignments, and review overrides.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!loadingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleRoleChangeConfirm();
              }}
              disabled={!!loadingId}
              className="bg-brand text-white hover:bg-brand/90"
            >
              {loadingId ? (
                <Loader2 className="size-4 animate-spin mr-1.5" />
              ) : null}
              Confirm Role Update
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
