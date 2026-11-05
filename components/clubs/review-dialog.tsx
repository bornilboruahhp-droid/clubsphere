"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
  Loader2,
  Sparkles,
  User,
  GraduationCap,
  MessageSquare,
} from "lucide-react";

import type { ReviewQueueClub } from "@/lib/data/reviews";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { formatDateTime } from "@/lib/format";

export interface ReviewDialogProps {
  club: ReviewQueueClub;
  role: "ADVISOR" | "ADMIN";
}

export function ReviewDialog({ club, role }: ReviewDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingDecision, setPendingDecision] = React.useState<
    "APPROVED" | "REJECTED" | null
  >(null);
  const [comment, setComment] = React.useState("");
  const [commentError, setCommentError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Identify current stage
  const currentPendingApproval = club.approvals.find(
    (a) => a.decision === "PENDING"
  );
  const stage = currentPendingApproval?.stage || (role === "ADMIN" ? "ADMIN" : "ADVISOR");

  // Prior advisor approval (relevant for ADMIN review)
  const priorAdvisorApproval = club.approvals.find(
    (a) => a.stage === "ADVISOR" && a.decision === "APPROVED"
  );

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setComment("");
      setCommentError(null);
      setPendingDecision(null);
    }
  };

  const initiateDecision = (decision: "APPROVED" | "REJECTED") => {
    setCommentError(null);

    if (decision === "REJECTED") {
      const trimmed = comment.trim();
      if (!trimmed || trimmed.length < 5) {
        setCommentError("A comment of at least 5 characters is required for rejection");
        return;
      }
    }

    setPendingDecision(decision);
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!pendingDecision) return;

    setIsSubmitting(true);
    setCommentError(null);

    try {
      const res = await fetch(`/api/clubs/${club.id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          decision: pendingDecision,
          comment: comment.trim() || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        const errorMsg = json.error?.message || "Failed to record review decision";
        if (json.error?.fields?.comment) {
          setCommentError(json.error.fields.comment);
        }
        toast.error(errorMsg);
        return;
      }

      toast.success(
        pendingDecision === "APPROVED"
          ? role === "ADVISOR"
            ? "Proposal approved and forwarded to Administration."
            : "Club charter granted and activated campus-wide!"
          : "Club proposal rejected."
      );

      setConfirmOpen(false);
      setOpen(false);
      router.refresh();
    } catch (err) {
      console.error("[ReviewDialog] Submission error:", err);
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            className="rounded-xl bg-brand text-brand-foreground hover:bg-brand/90 font-medium text-xs h-8"
          >
            Review Proposal
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-surface-border bg-elevated p-6 sm:p-8 rounded-3xl">
          <DialogHeader className="space-y-2 border-b border-surface-border pb-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <DialogTitle className="text-xl font-bold text-copy-primary">
                {club.name}
              </DialogTitle>
              <Badge
                variant="outline"
                className="bg-state-warning-dim text-state-warning border-state-warning/30 text-xs font-medium"
              >
                {stage === "ADVISOR"
                  ? "Faculty Sponsor Review"
                  : "Administration Charter Review"}
              </Badge>
            </div>
            <DialogDescription className="text-xs text-copy-muted">
              Inspect the proposed organization's charter, mission, and milestones before recording a binding decision.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {/* Proposer Info Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-surface-border bg-surface p-4 text-xs">
              <div className="flex items-start gap-2.5">
                <User className="size-4 text-brand shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-copy-primary block">
                    {club.proposer.name}
                  </span>
                  <span className="text-copy-muted">{club.proposer.email}</span>
                </div>
              </div>

              <div>
                <span className="text-copy-muted block">Student ID / Department</span>
                <span className="font-mono text-copy-secondary">
                  {club.proposer.studentId || "N/A"} • {club.proposer.department || "Undeclared"}
                </span>
              </div>
            </div>

            {/* Prior Advisor Review (Shown to Admins) */}
            {role === "ADMIN" && priorAdvisorApproval && (
              <div className="rounded-xl border border-state-success/30 bg-state-success-dim/30 p-4 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-state-success font-semibold">
                  <GraduationCap className="size-4" />
                  <span>Faculty Advisor Endorsement</span>
                </div>
                {priorAdvisorApproval.reviewer?.name && (
                  <p className="text-copy-secondary">
                    Approved by <strong>{priorAdvisorApproval.reviewer.name}</strong>
                    {priorAdvisorApproval.decidedAt && (
                      <span className="text-copy-muted ml-1">
                        on {formatDateTime(priorAdvisorApproval.decidedAt)}
                      </span>
                    )}
                  </p>
                )}
                {priorAdvisorApproval.comment && (
                  <p className="italic text-copy-primary pl-2 border-l-2 border-state-success/40">
                    "{priorAdvisorApproval.comment}"
                  </p>
                )}
              </div>
            )}

            {/* Club Mission */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-copy-muted">
                Charter Mission & Description
              </h4>
              <p className="text-xs sm:text-sm text-copy-secondary leading-relaxed bg-surface rounded-xl p-4 border border-surface-border whitespace-pre-line">
                {club.description}
              </p>
            </div>

            {/* Charter Objectives */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-copy-muted flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-brand" />
                Proposed First-Cycle Objectives
              </h4>
              <div className="space-y-2">
                {club.objectives.map((obj, i) => (
                  <div
                    key={obj.id}
                    className="flex items-start gap-2.5 rounded-lg border border-surface-border/70 bg-surface p-3 text-xs"
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-subtle text-[11px] font-mono font-bold text-copy-primary">
                      {i + 1}
                    </span>
                    <span className="text-copy-primary font-medium">{obj.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Decision Notes */}
            <div className="space-y-2 pt-2 border-t border-surface-border">
              <label className="text-xs font-medium text-copy-primary flex items-center gap-1.5">
                <MessageSquare className="size-3.5 text-copy-muted" />
                Review Comments & Notes
              </label>
              <Textarea
                placeholder="Provide feedback or justification (required with at least 5 characters if rejecting)..."
                rows={3}
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  if (commentError) setCommentError(null);
                }}
                disabled={isSubmitting}
                className="rounded-xl border-surface-border bg-surface text-copy-primary focus-visible:ring-brand text-xs min-h-20"
              />
              {commentError && (
                <p className="text-xs text-state-error flex items-center gap-1">
                  <AlertTriangle className="size-3" />
                  {commentError}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-surface-border">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
                className="w-full sm:w-auto text-xs rounded-xl text-copy-secondary hover:text-copy-primary hover:bg-subtle"
              >
                Close
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => initiateDecision("REJECTED")}
                disabled={isSubmitting}
                className="w-full sm:w-auto text-xs rounded-xl border-state-error/40 text-state-error hover:bg-state-error-dim"
              >
                <X className="size-3.5 mr-1.5" />
                Reject Proposal
              </Button>

              <Button
                type="button"
                onClick={() => initiateDecision("APPROVED")}
                disabled={isSubmitting}
                className="w-full sm:w-auto text-xs rounded-xl bg-state-success text-white hover:bg-state-success/90 font-medium"
              >
                <Check className="size-3.5 mr-1.5" />
                {role === "ADVISOR" ? "Approve & Forward to Admin" : "Grant Charter (Activate Club)"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="border-surface-border bg-elevated rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-copy-primary">
              {pendingDecision === "APPROVED"
                ? "Confirm Club Approval"
                : "Confirm Club Rejection"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-copy-secondary leading-relaxed">
              {pendingDecision === "APPROVED" ? (
                role === "ADVISOR" ? (
                  `Are you sure you want to approve "${club.name}" as its faculty advisor? The proposal will immediately advance to campus administration for final chartering.`
                ) : (
                  `Are you sure you want to approve and charter "${club.name}"? The club will become ACTIVE campus-wide immediately.`
                )
              ) : (
                `Are you sure you want to reject "${club.name}"? This decision is terminal and will notify the proposer with your review comment.`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {pendingDecision === "REJECTED" && (
            <div className="rounded-xl bg-subtle p-3 text-xs text-copy-primary border border-surface-border italic">
              "{comment}"
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isSubmitting}
              className="text-xs rounded-xl border-surface-border"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
              className={`text-xs rounded-xl font-medium ${
                pendingDecision === "APPROVED"
                  ? "bg-state-success text-white hover:bg-state-success/90"
                  : "bg-state-error text-white hover:bg-state-error/90"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                  Recording...
                </>
              ) : pendingDecision === "APPROVED" ? (
                "Confirm Approval"
              ) : (
                "Confirm Rejection"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
