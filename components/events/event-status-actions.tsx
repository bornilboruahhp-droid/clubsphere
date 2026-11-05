"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Send,
  XCircle,
  CheckCircle2,
  Pencil,
  Loader2,
} from "lucide-react";
import type { EventStatus } from "@prisma/client";
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
} from "@/components/ui/alert-dialog";

interface EventStatusActionsProps {
  eventId: string;
  clubId: string;
  status: EventStatus;
  startsAt: Date | string;
  registrationCount: number;
}

export function EventStatusActions({
  eventId,
  clubId,
  status,
  startsAt,
  registrationCount,
}: EventStatusActionsProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "PUBLISHED" | "CANCELLED" | "COMPLETED" | null
  >(null);

  const isPastStart = new Date() >= new Date(startsAt);

  const handleStatusChange = async (newStatus: "PUBLISHED" | "CANCELLED" | "COMPLETED") => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || `Failed to transition event to ${newStatus}`);
      }

      toast.success(
        newStatus === "PUBLISHED"
          ? "Event published! Active club members have been notified."
          : newStatus === "CANCELLED"
          ? "Event cancelled! Registrants have been notified."
          : "Event marked as completed."
      );

      setPendingAction(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update event status");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* 1. Edit Button (Allowed while DRAFT or PUBLISHED) */}
      {(status === "DRAFT" || status === "PUBLISHED") && (
        <Button
          asChild
          variant="outline"
          size="sm"
          className="border-surface-border text-copy-primary hover:bg-subtle gap-1.5 h-9"
        >
          <Link href={`/clubs/${clubId}/events/${eventId}/edit`}>
            <Pencil className="size-3.5 text-copy-muted" />
            Edit Details
          </Link>
        </Button>
      )}

      {/* 2. Publish Button (Available in DRAFT) */}
      {status === "DRAFT" && (
        <Button
          onClick={() => setPendingAction("PUBLISHED")}
          size="sm"
          className="bg-brand text-brand-foreground hover:bg-brand/90 gap-1.5 h-9 font-medium shadow-xs"
        >
          <Send className="size-3.5" />
          Publish Event
        </Button>
      )}

      {/* 3. Mark Completed Button (Available in PUBLISHED if startsAt has passed) */}
      {status === "PUBLISHED" && (
        <Button
          onClick={() => setPendingAction("COMPLETED")}
          disabled={!isPastStart}
          size="sm"
          variant="outline"
          className="border-state-success/40 text-state-success hover:bg-state-success-dim hover:text-state-success gap-1.5 h-9 font-medium"
        >
          <CheckCircle2 className="size-3.5" />
          Mark Completed
        </Button>
      )}

      {/* 4. Cancel Event Button (Available in DRAFT or PUBLISHED) */}
      {(status === "DRAFT" || status === "PUBLISHED") && (
        <Button
          onClick={() => setPendingAction("CANCELLED")}
          size="sm"
          variant="outline"
          className="border-surface-border text-state-error hover:bg-state-error-dim hover:text-state-error gap-1.5 h-9"
        >
          <XCircle className="size-3.5" />
          Cancel Event
        </Button>
      )}

      {/* Confirmation Dialog with Consequence Summary */}
      <AlertDialog
        open={!!pendingAction}
        onOpenChange={(open) => !open && setPendingAction(null)}
      >
        <AlertDialogContent className="bg-surface border-surface-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-copy-primary">
              {pendingAction === "PUBLISHED"
                ? "Publish Event?"
                : pendingAction === "CANCELLED"
                ? "Cancel Event?"
                : "Mark Event Completed?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-copy-secondary">
              {pendingAction === "PUBLISHED" ? (
                "Publishing will schedule the event officially. Active club members will receive an in-app notification, and the event will be published to the campus feed."
              ) : pendingAction === "CANCELLED" ? (
                status === "PUBLISHED" ? (
                  `Cancelling will notify all ${registrationCount} registered attendees immediately that this event will no longer take place. This action is terminal and cannot be reversed.`
                ) : (
                  "This draft event will be cancelled and cannot be reopened."
                )
              ) : (
                "Marking this event as completed archives it and locks further registration changes."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isSubmitting}
              className="border-surface-border text-copy-primary hover:bg-subtle"
            >
              Keep as is
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (pendingAction) {
                  handleStatusChange(pendingAction);
                }
              }}
              disabled={isSubmitting}
              className={
                pendingAction === "CANCELLED"
                  ? "bg-state-error text-state-error-foreground hover:bg-state-error/90"
                  : pendingAction === "COMPLETED"
                  ? "bg-state-success text-state-success-foreground hover:bg-state-success/90"
                  : "bg-brand text-brand-foreground hover:bg-brand/90"
              }
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="size-3.5 animate-spin" />
                  Updating...
                </span>
              ) : pendingAction === "PUBLISHED" ? (
                "Publish Event"
              ) : pendingAction === "CANCELLED" ? (
                "Confirm Cancellation"
              ) : (
                "Mark Completed"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
