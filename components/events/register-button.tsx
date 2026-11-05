"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, XCircle, AlertCircle, Loader2 } from "lucide-react";
import type { EventStatus, EventVisibility, AttendanceStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface RegisterButtonProps {
  eventId: string;
  status: EventStatus;
  visibility: EventVisibility;
  startsAt: string | Date;
  endsAt: string | Date;
  capacity: number | null;
  activeRegistrationCount: number;
  isClubMember: boolean;
  registration: {
    id: string;
    status: AttendanceStatus;
  } | null;
  className?: string;
  size?: "default" | "sm" | "lg";
}

export function RegisterButton({
  eventId,
  status,
  visibility,
  startsAt,
  endsAt,
  capacity,
  activeRegistrationCount,
  isClubMember,
  registration,
  className = "",
  size = "default",
}: RegisterButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const startDate = new Date(startsAt);
  const endDate = new Date(endsAt);
  const now = new Date();

  const isEnded = endDate <= now;
  const isStarted = startDate <= now;
  const isCancelled = status === "CANCELLED";
  const isFull = capacity !== null && activeRegistrationCount >= capacity;
  const isRegistered = registration?.status === "REGISTERED";
  const isMembersOnlyRestricted = visibility === "MEMBERS_ONLY" && !isClubMember;

  // 1. Event is cancelled
  if (isCancelled) {
    return (
      <Button
        variant="outline"
        size={size}
        disabled
        className={`border-state-error/30 bg-state-error-dim text-state-error cursor-not-allowed opacity-80 ${className}`}
      >
        <XCircle className="size-4 mr-2" />
        Event Cancelled
      </Button>
    );
  }

  // 2. Event has ended
  if (isEnded) {
    return (
      <Button
        variant="outline"
        size={size}
        disabled
        className={`border-surface-border bg-subtle text-copy-muted cursor-not-allowed opacity-80 ${className}`}
      >
        Event Ended
      </Button>
    );
  }

  // 3. User is already registered
  if (isRegistered) {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-state-success/30 bg-state-success-dim text-state-success text-xs sm:text-sm font-semibold">
          <Check className="size-4" />
          Registered
        </div>

        {/* Can only cancel if event hasn't started yet */}
        {!isStarted ? (
          <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size={size}
                disabled={isLoading}
                className="border-surface-border text-copy-secondary hover:text-state-error hover:bg-state-error-dim hover:border-state-error/30 text-xs sm:text-sm"
              >
                {isLoading ? (
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                ) : null}
                Cancel Registration
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel your registration?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your reserved spot will be released. You can register again later
                  if capacity allows before the event starts.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Reservation</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async (e) => {
                    e.preventDefault();
                    setIsLoading(true);
                    try {
                      const res = await fetch(
                        `/api/events/${eventId}/registrations/me`,
                        { method: "DELETE" }
                      );
                      const data = await res.json();
                      if (!res.ok) {
                        throw new Error(data.error?.message || "Failed to cancel registration");
                      }
                      toast.success("Registration cancelled successfully.");
                      setIsCancelDialogOpen(false);
                      router.refresh();
                    } catch (err: any) {
                      toast.error(err.message || "Failed to cancel registration.");
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="bg-state-error text-white hover:bg-state-error/90"
                >
                  {isLoading ? (
                    <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  ) : null}
                  Confirm Cancellation
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <span className="text-xs text-copy-muted">In Progress</span>
        )}
      </div>
    );
  }

  // 4. Restricted: Members Only & Caller is not a member
  if (isMembersOnlyRestricted) {
    return (
      <Button
        variant="outline"
        size={size}
        disabled
        className={`border-state-warning/30 bg-state-warning-dim text-state-warning cursor-not-allowed opacity-80 ${className}`}
      >
        <AlertCircle className="size-4 mr-2" />
        Club Members Only
      </Button>
    );
  }

  // 5. Event is full
  if (isFull) {
    return (
      <Button
        variant="outline"
        size={size}
        disabled
        className={`border-surface-border bg-subtle text-copy-muted cursor-not-allowed opacity-80 ${className}`}
      >
        Event Full
      </Button>
    );
  }

  // 6. Normal Register State
  const handleRegister = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/registrations`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to register for event");
      }

      toast.success("You are successfully registered!");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to register for event.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleRegister}
      disabled={isLoading}
      size={size}
      className={`bg-brand text-white hover:bg-brand/90 font-medium ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="size-4 animate-spin mr-2" />
          Registering...
        </>
      ) : (
        "Register for Event"
      )}
    </Button>
  );
}
