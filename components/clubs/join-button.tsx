"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  UserPlus,
  Clock,
  Check,
  LogOut,
  ChevronDown,
  Loader2,
} from "lucide-react";
import type { ClubRole, ClubStatus, MembershipStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

interface JoinButtonProps {
  clubId: string;
  clubStatus: ClubStatus;
  membership: {
    role: ClubRole;
    status: MembershipStatus;
  } | null;
  isProfileComplete?: boolean;
}

export function JoinButton({
  clubId,
  clubStatus,
  membership,
  isProfileComplete = true,
}: JoinButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  // Hidden for President or non-active clubs
  if (clubStatus !== "ACTIVE" || (membership?.status === "ACTIVE" && membership.role === "PRESIDENT")) {
    return null;
  }

  // 1. Active Member State (with Leave option)
  if (membership?.status === "ACTIVE") {
    const handleLeave = async () => {
      setIsSubmitting(true);
      try {
        const res = await fetch(`/api/clubs/${clubId}/members/me`, {
          method: "DELETE",
        });

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error?.message || "Failed to leave organization");
        }

        toast.success("You have left the organization");
        setLeaveDialogOpen(false);
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Failed to leave organization");
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 border-surface-border bg-surface text-copy-primary hover:bg-subtle"
            >
              <Check className="size-3.5 text-brand" />
              <span>Member</span>
              <ChevronDown className="size-3 text-copy-muted ml-0.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-surface border-surface-border">
            <DropdownMenuItem
              className="text-state-error focus:text-state-error focus:bg-state-error-dim cursor-pointer gap-2"
              onClick={() => setLeaveDialogOpen(true)}
            >
              <LogOut className="size-4" />
              Leave Organization
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
          <AlertDialogContent className="bg-surface border-surface-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-copy-primary">
                Leave Organization?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-copy-secondary">
                Are you sure you want to leave this organization? You will lose access to member activities, internal events, and voting privileges.
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
                  handleLeave();
                }}
                disabled={isSubmitting}
                className="bg-state-error text-state-error-foreground hover:bg-state-error/90"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="size-3.5 animate-spin" />
                    Leaving...
                  </span>
                ) : (
                  "Leave Organization"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // 2. Pending Request State (with cancel option)
  if (membership?.status === "PENDING") {
    const handleCancel = async () => {
      setIsSubmitting(true);
      try {
        const res = await fetch(`/api/clubs/${clubId}/members/me`, {
          method: "DELETE",
        });

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error?.message || "Failed to cancel join request");
        }

        toast.success("Membership request withdrawn");
        setCancelDialogOpen(false);
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Failed to cancel request");
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="flex items-center gap-2">
        <Badge
          variant="secondary"
          className="h-9 px-3 gap-1.5 bg-state-warning-dim text-state-warning border border-state-warning/30 text-xs font-medium"
        >
          <Clock className="size-3.5" />
          Request Pending
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCancelDialogOpen(true)}
          disabled={isSubmitting}
          className="h-9 text-xs text-copy-muted hover:text-state-error hover:bg-state-error-dim"
        >
          Cancel
        </Button>

        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <AlertDialogContent className="bg-surface border-surface-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-copy-primary">
                Withdraw Request?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-copy-secondary">
                Are you sure you want to withdraw your membership request for this organization?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={isSubmitting}
                className="border-surface-border text-copy-primary hover:bg-subtle"
              >
                Keep Request
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleCancel();
                }}
                disabled={isSubmitting}
                className="bg-state-error text-state-error-foreground hover:bg-state-error/90"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="size-3.5 animate-spin" />
                    Withdrawing...
                  </span>
                ) : (
                  "Withdraw Request"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // 3. Not a Member (Join Button)
  const handleJoin = async () => {
    if (!isProfileComplete) {
      toast.error("Please complete your student profile before joining clubs");
      router.push("/onboarding");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}/members`, {
        method: "POST",
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to submit membership request");
      }

      toast.success("Membership request submitted to club managers");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to join club");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Button
      onClick={handleJoin}
      disabled={isSubmitting}
      className="h-9 gap-1.5 bg-brand text-brand-foreground hover:bg-brand/90 font-medium shadow-xs"
    >
      {isSubmitting ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <UserPlus className="size-4" />
      )}
      Join Club
    </Button>
  );
}
