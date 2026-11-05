"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Shield,
  ShieldAlert,
  UserMinus,
  UserCheck,
  Loader2,
} from "lucide-react";
import type { ClubRole } from "@prisma/client";
import type { ClubMemberItem } from "@/lib/data/members";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface MemberActionsMenuProps {
  clubId: string;
  member: ClubMemberItem;
  currentTreasurer?: { id: string; name: string } | null;
  currentSecretary?: { id: string; name: string } | null;
  onMemberUpdated: (updated: ClubMemberItem) => void;
  onMemberRemoved: (membershipId: string) => void;
}

export function MemberActionsMenu({
  clubId,
  member,
  currentTreasurer,
  currentSecretary,
  onMemberUpdated,
  onMemberRemoved,
}: MemberActionsMenuProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    | { type: "role"; role: "TREASURER" | "SECRETARY" | "MEMBER"; replacedName?: string }
    | { type: "remove" }
    | null
  >(null);

  // President cannot be modified or removed through this menu
  if (member.role === "PRESIDENT") {
    return null;
  }

  const handleRoleSelect = (role: "TREASURER" | "SECRETARY" | "MEMBER") => {
    if (role === member.role) return;

    if (role === "TREASURER" && currentTreasurer && currentTreasurer.id !== member.id) {
      setPendingAction({
        type: "role",
        role: "TREASURER",
        replacedName: currentTreasurer.name,
      });
      return;
    }

    if (role === "SECRETARY" && currentSecretary && currentSecretary.id !== member.id) {
      setPendingAction({
        type: "role",
        role: "SECRETARY",
        replacedName: currentSecretary.name,
      });
      return;
    }

    setPendingAction({ type: "role", role });
  };

  const executeRoleChange = async (role: "TREASURER" | "SECRETARY" | "MEMBER") => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_role", role }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to update member role");
      }

      toast.success(`${member.user.name}'s role updated to ${role}`);
      onMemberUpdated({ ...member, role });
      setPendingAction(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to change role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeRemoval = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove" }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to remove member");
      }

      toast.success(`${member.user.name} removed from organization`);
      onMemberRemoved(member.id);
      setPendingAction(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to remove member");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-copy-muted hover:text-copy-primary hover:bg-subtle"
          >
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Open actions menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-surface border-surface-border">
          {member.role !== "SECRETARY" && (
            <DropdownMenuItem
              onClick={() => handleRoleSelect("SECRETARY")}
              className="gap-2 cursor-pointer text-copy-primary focus:bg-subtle"
            >
              <Shield className="size-4 text-brand" />
              Make Secretary
            </DropdownMenuItem>
          )}

          {member.role !== "TREASURER" && (
            <DropdownMenuItem
              onClick={() => handleRoleSelect("TREASURER")}
              className="gap-2 cursor-pointer text-copy-primary focus:bg-subtle"
            >
              <Shield className="size-4 text-brand" />
              Make Treasurer
            </DropdownMenuItem>
          )}

          {member.role !== "MEMBER" && (
            <DropdownMenuItem
              onClick={() => handleRoleSelect("MEMBER")}
              className="gap-2 cursor-pointer text-copy-primary focus:bg-subtle"
            >
              <UserCheck className="size-4 text-copy-muted" />
              Make Member
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator className="bg-surface-border" />

          <DropdownMenuItem
            onClick={() => setPendingAction({ type: "remove" })}
            className="gap-2 cursor-pointer text-state-error focus:text-state-error focus:bg-state-error-dim"
          >
            <UserMinus className="size-4" />
            Remove from Club
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirmation Dialog for Role Change or Removal */}
      <AlertDialog
        open={!!pendingAction}
        onOpenChange={(open) => !open && setPendingAction(null)}
      >
        <AlertDialogContent className="bg-surface border-surface-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-copy-primary">
              {pendingAction?.type === "remove"
                ? "Remove Member?"
                : `Assign Role: ${pendingAction?.role}`}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-copy-secondary">
              {pendingAction?.type === "remove" ? (
                `Are you sure you want to remove ${member.user.name} from the club? They will lose access to member resources and activities.`
              ) : pendingAction?.replacedName ? (
                <>
                  Assigning <strong>{member.user.name}</strong> as{" "}
                  <strong>{pendingAction.role}</strong> will replace{" "}
                  <strong>{pendingAction.replacedName}</strong>, who will become a general Member. Are you sure you want to proceed?
                </>
              ) : (
                `Are you sure you want to change ${member.user.name}'s role to ${pendingAction?.role}?`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isSubmitting}
              className="border-surface-border text-copy-primary hover:bg-subtle"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (pendingAction?.type === "remove") {
                  executeRemoval();
                } else if (pendingAction?.type === "role") {
                  executeRoleChange(pendingAction.role);
                }
              }}
              disabled={isSubmitting}
              className={
                pendingAction?.type === "remove"
                  ? "bg-state-error text-state-error-foreground hover:bg-state-error/90"
                  : "bg-brand text-brand-foreground hover:bg-brand/90"
              }
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="size-3.5 animate-spin" />
                  Updating...
                </span>
              ) : pendingAction?.type === "remove" ? (
                "Remove Member"
              ) : (
                "Confirm Role Change"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
