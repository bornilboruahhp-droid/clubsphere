"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Target,
  Plus,
  Calendar,
  Clock,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
  History,
  Loader2,
  Sparkles,
} from "lucide-react";
import type { ObjectiveStatus } from "@prisma/client";
import type { ClubObjectiveItem } from "@/lib/data/objectives";
import { formatDate, formatRelative } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/layout/empty-state";
import { ObjectiveStatusBadge } from "./objective-status-badge";

interface ClubObjectivesViewProps {
  clubId: string;
  initialObjectives: ClubObjectiveItem[];
  isManager: boolean;
}

interface UpdateTimelineItem {
  id: string;
  note: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
  };
}

export function ClubObjectivesView({
  clubId,
  initialObjectives,
  isManager,
}: ClubObjectivesViewProps) {
  const router = useRouter();
  const [objectives, setObjectives] = useState<ClubObjectiveItem[]>(initialObjectives);

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState<ClubObjectiveItem | null>(null);
  const [deletingObjective, setDeletingObjective] = useState<ClubObjectiveItem | null>(null);
  const [progressObjective, setProgressObjective] = useState<ClubObjectiveItem | null>(null);
  const [timelineObjective, setTimelineObjective] = useState<ClubObjectiveItem | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTargetDate, setFormTargetDate] = useState("");
  const [formStatus, setFormStatus] = useState<ObjectiveStatus>("PLANNED");
  const [formProgressNote, setFormProgressNote] = useState("");
  const [formProgressStatus, setFormProgressStatus] = useState<ObjectiveStatus>("IN_PROGRESS");

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineUpdates, setTimelineUpdates] = useState<UpdateTimelineItem[]>([]);

  // 1. Handle Add Objective
  const handleOpenAdd = () => {
    setFormTitle("");
    setFormDescription("");
    setFormTargetDate("");
    setIsAddOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formTitle.trim().length < 3) {
      toast.error("Title must be at least 3 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}/objectives`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDescription.trim() || undefined,
          targetDate: formTargetDate || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to create objective");
      }

      toast.success("Objective created successfully");
      setIsAddOpen(false);
      router.refresh();

      setObjectives((prev) => [
        ...prev,
        {
          ...json.data,
          targetDate: json.data.targetDate ? new Date(json.data.targetDate) : null,
          createdAt: new Date(json.data.createdAt),
          updatedAt: new Date(json.data.updatedAt),
          latestUpdate: null,
          updateCount: 0,
        },
      ]);
    } catch (err: any) {
      toast.error(err.message || "Failed to create objective");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Handle Edit Objective
  const handleOpenEdit = (obj: ClubObjectiveItem) => {
    setEditingObjective(obj);
    setFormTitle(obj.title);
    setFormDescription(obj.description || "");
    setFormStatus(obj.status);
    setFormTargetDate(
      obj.targetDate
        ? new Date(obj.targetDate).toISOString().split("T")[0]
        : ""
    );
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingObjective) return;
    if (formTitle.trim().length < 3) {
      toast.error("Title must be at least 3 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/clubs/${clubId}/objectives/${editingObjective.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formTitle.trim(),
            description: formDescription.trim() || null,
            status: formStatus,
            targetDate: formTargetDate || null,
          }),
        }
      );

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to update objective");
      }

      toast.success("Objective updated successfully");
      const updated = json.data;
      setObjectives((prev) =>
        prev.map((o) =>
          o.id === editingObjective.id
            ? {
                ...o,
                title: updated.title,
                description: updated.description,
                status: updated.status,
                targetDate: updated.targetDate ? new Date(updated.targetDate) : null,
                updatedAt: new Date(updated.updatedAt),
              }
            : o
        )
      );
      setEditingObjective(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update objective");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Handle Delete Objective
  const handleDeleteConfirm = async () => {
    if (!deletingObjective) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/clubs/${clubId}/objectives/${deletingObjective.id}`,
        {
          method: "DELETE",
        }
      );

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to delete objective");
      }

      toast.success("Objective deleted");
      setObjectives((prev) => prev.filter((o) => o.id !== deletingObjective.id));
      setDeletingObjective(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete objective");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Handle Add Progress Note
  const handleOpenProgress = (obj: ClubObjectiveItem) => {
    setProgressObjective(obj);
    setFormProgressNote("");
    setFormProgressStatus(obj.status === "PLANNED" ? "IN_PROGRESS" : obj.status);
  };

  const handleProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progressObjective) return;
    if (formProgressNote.trim().length < 3) {
      toast.error("Progress note must be at least 3 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/clubs/${clubId}/objectives/${progressObjective.id}/updates`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            note: formProgressNote.trim(),
            status: formProgressStatus,
          }),
        }
      );

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to record progress");
      }

      toast.success("Progress note recorded");
      const createdUpdate = json.data;

      setObjectives((prev) =>
        prev.map((o) =>
          o.id === progressObjective.id
            ? {
                ...o,
                status: formProgressStatus,
                updateCount: o.updateCount + 1,
                latestUpdate: {
                  id: createdUpdate.id,
                  note: createdUpdate.note,
                  createdAt: new Date(createdUpdate.createdAt),
                  author: createdUpdate.author,
                },
              }
            : o
        )
      );

      setProgressObjective(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to record progress");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Handle View Progress Timeline
  const handleOpenTimeline = async (obj: ClubObjectiveItem) => {
    setTimelineObjective(obj);
    setTimelineLoading(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}/objectives/${obj.id}/updates`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to load timeline");
      }
      setTimelineUpdates(json.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load updates");
    } finally {
      setTimelineLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Objective Counter and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h2 className="text-lg font-semibold text-copy-primary">
            Club Objectives & Milestones
          </h2>
          <p className="text-xs text-copy-muted">
            Track strategic semester deliverables, charter goals, and verified progress.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-lg bg-subtle border border-surface-border text-copy-secondary">
            {objectives.length} / 20 objectives
          </span>

          {isManager && (
            <Button
              onClick={handleOpenAdd}
              disabled={objectives.length >= 20}
              size="sm"
              className="h-9 gap-1.5 bg-brand text-brand-foreground hover:bg-brand/90 font-medium shadow-xs"
            >
              <Plus className="size-4" />
              Add Objective
            </Button>
          )}
        </div>
      </div>

      {/* Objectives List */}
      {objectives.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No objectives recorded"
          description={
            isManager
              ? "Get started by adding your first club objective or semester milestone."
              : "Club leadership has not published active objectives yet."
          }
        />
      ) : (
        <div className="space-y-4">
          {objectives.map((obj, index) => (
            <div
              key={obj.id}
              className="rounded-2xl border border-surface-border bg-surface p-5 sm:p-6 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-subtle text-xs font-mono font-bold text-copy-primary shadow-xs mt-0.5">
                    {index + 1}
                  </span>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-copy-primary">
                        {obj.title}
                      </h3>
                      <ObjectiveStatusBadge status={obj.status} />
                    </div>
                    {obj.description && (
                      <p className="text-xs sm:text-sm text-copy-secondary leading-relaxed">
                        {obj.description}
                      </p>
                    )}
                  </div>
                </div>

                {isManager && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-copy-muted hover:text-copy-primary hover:bg-subtle"
                      >
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 bg-surface border-surface-border">
                      <DropdownMenuItem
                        onClick={() => handleOpenEdit(obj)}
                        className="gap-2 cursor-pointer text-copy-primary focus:bg-subtle"
                      >
                        <Pencil className="size-3.5 text-copy-muted" />
                        Edit Objective
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingObjective(obj)}
                        className="gap-2 cursor-pointer text-state-error focus:text-state-error focus:bg-state-error-dim"
                      >
                        <Trash2 className="size-3.5" />
                        Delete Objective
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Target Date & Metadata Bar */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-copy-muted pt-2 border-t border-surface-border/60">
                {obj.targetDate && (
                  <span className="flex items-center gap-1.5 font-medium text-copy-secondary">
                    <Calendar className="size-3.5 text-brand" />
                    Target: {formatDate(obj.targetDate)}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5 text-copy-muted" />
                  Added {formatDate(obj.createdAt)}
                </span>
                <span className="flex items-center gap-1.5 font-mono">
                  <History className="size-3.5 text-copy-muted" />
                  {obj.updateCount} {obj.updateCount === 1 ? "update" : "updates"}
                </span>
              </div>

              {/* Latest Progress Note Callout */}
              {obj.latestUpdate ? (
                <div className="rounded-xl border border-surface-border/70 bg-subtle/50 p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-copy-muted">
                    <span className="font-semibold text-copy-secondary flex items-center gap-1.5">
                      <Sparkles className="size-3 text-brand" />
                      Latest Progress ({obj.latestUpdate.author.name})
                    </span>
                    <span>{formatRelative(new Date(obj.latestUpdate.createdAt))}</span>
                  </div>
                  <p className="text-xs text-copy-primary leading-relaxed">
                    {obj.latestUpdate.note}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-surface-border/50 bg-subtle/30 px-3.5 py-2.5 text-xs text-copy-muted italic">
                  No progress updates submitted yet.
                </div>
              )}

              {/* Action Buttons: View History & Add Progress */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenTimeline(obj)}
                  className="h-8 text-xs text-copy-secondary hover:text-copy-primary hover:bg-subtle gap-1.5"
                >
                  <History className="size-3.5 text-copy-muted" />
                  View Progress Timeline ({obj.updateCount})
                </Button>

                {isManager && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenProgress(obj)}
                    className="h-8 text-xs border-surface-border text-copy-primary hover:bg-subtle gap-1.5 font-medium"
                  >
                    <MessageSquare className="size-3.5 text-brand" />
                    Add Progress
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog 1: Add Objective */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="bg-surface border-surface-border sm:max-w-md">
          <form onSubmit={handleAddSubmit}>
            <DialogHeader>
              <DialogTitle className="text-copy-primary">
                Add Club Objective
              </DialogTitle>
              <DialogDescription className="text-copy-secondary">
                Set a milestone or charter goal for this organization.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-copy-primary text-xs">
                  Title <span className="text-state-error">*</span>
                </Label>
                <Input
                  id="title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Host campus-wide hackathon"
                  maxLength={120}
                  className="bg-surface border-surface-border text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-copy-primary text-xs">
                  Description (optional)
                </Label>
                <Textarea
                  id="description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Elaborate on expected deliverables or scope..."
                  maxLength={1000}
                  className="bg-surface border-surface-border text-sm resize-none h-20"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="targetDate" className="text-copy-primary text-xs">
                  Target Completion Date (optional)
                </Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={formTargetDate}
                  onChange={(e) => setFormTargetDate(e.target.value)}
                  className="bg-surface border-surface-border text-sm"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setIsAddOpen(false)}
                className="border-surface-border text-copy-primary"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-brand text-brand-foreground hover:bg-brand/90 font-medium"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="size-3.5 animate-spin" />
                    Creating...
                  </span>
                ) : (
                  "Create Objective"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog 2: Edit Objective */}
      <Dialog
        open={!!editingObjective}
        onOpenChange={(open) => !open && setEditingObjective(null)}
      >
        <DialogContent className="bg-surface border-surface-border sm:max-w-md">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle className="text-copy-primary">
                Edit Objective
              </DialogTitle>
              <DialogDescription className="text-copy-secondary">
                Update objective details, milestone status, or timeline.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-title" className="text-copy-primary text-xs">
                  Title <span className="text-state-error">*</span>
                </Label>
                <Input
                  id="edit-title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  maxLength={120}
                  className="bg-surface border-surface-border text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-description" className="text-copy-primary text-xs">
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  maxLength={1000}
                  className="bg-surface border-surface-border text-sm resize-none h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-copy-primary text-xs">Status</Label>
                  <Select
                    value={formStatus}
                    onValueChange={(val) => setFormStatus(val as ObjectiveStatus)}
                  >
                    <SelectTrigger className="bg-surface border-surface-border text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-surface border-surface-border">
                      <SelectItem value="PLANNED">Planned</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="ACHIEVED">Achieved</SelectItem>
                      <SelectItem value="DROPPED">Dropped</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-targetDate" className="text-copy-primary text-xs">
                    Target Date
                  </Label>
                  <Input
                    id="edit-targetDate"
                    type="date"
                    value={formTargetDate}
                    onChange={(e) => setFormTargetDate(e.target.value)}
                    className="bg-surface border-surface-border text-xs"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setEditingObjective(null)}
                className="border-surface-border text-copy-primary"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-brand text-brand-foreground hover:bg-brand/90 font-medium"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="size-3.5 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog 3: Delete Objective Confirmation */}
      <AlertDialog
        open={!!deletingObjective}
        onOpenChange={(open) => !open && setDeletingObjective(null)}
      >
        <AlertDialogContent className="bg-surface border-surface-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-copy-primary">
              Delete Objective?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-copy-secondary">
              Are you sure you want to delete &quot;{deletingObjective?.title}&quot;? All associated progress history will be permanently deleted.
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
                handleDeleteConfirm();
              }}
              disabled={isSubmitting}
              className="bg-state-error text-state-error-foreground hover:bg-state-error/90"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="size-3.5 animate-spin" />
                  Deleting...
                </span>
              ) : (
                "Delete Objective"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog 4: Add Progress Note */}
      <Dialog
        open={!!progressObjective}
        onOpenChange={(open) => !open && setProgressObjective(null)}
      >
        <DialogContent className="bg-surface border-surface-border sm:max-w-md">
          <form onSubmit={handleProgressSubmit}>
            <DialogHeader>
              <DialogTitle className="text-copy-primary">
                Add Progress Update
              </DialogTitle>
              <DialogDescription className="text-copy-secondary">
                Document progress made toward &quot;{progressObjective?.title}&quot;.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="progress-note" className="text-copy-primary text-xs">
                  Progress Note <span className="text-state-error">*</span>
                </Label>
                <Textarea
                  id="progress-note"
                  value={formProgressNote}
                  onChange={(e) => setFormProgressNote(e.target.value)}
                  placeholder="Describe recent milestones, meetings, or accomplishments..."
                  maxLength={1000}
                  className="bg-surface border-surface-border text-sm resize-none h-24"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-copy-primary text-xs">
                  Update Objective Status
                </Label>
                <Select
                  value={formProgressStatus}
                  onValueChange={(val) =>
                    setFormProgressStatus(val as ObjectiveStatus)
                  }
                >
                  <SelectTrigger className="bg-surface border-surface-border text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-surface border-surface-border">
                    <SelectItem value="PLANNED">Planned</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="ACHIEVED">Achieved</SelectItem>
                    <SelectItem value="DROPPED">Dropped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setProgressObjective(null)}
                className="border-surface-border text-copy-primary"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-brand text-brand-foreground hover:bg-brand/90 font-medium"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="size-3.5 animate-spin" />
                    Recording...
                  </span>
                ) : (
                  "Post Update"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog 5: Progress Timeline History */}
      <Dialog
        open={!!timelineObjective}
        onOpenChange={(open) => !open && setTimelineObjective(null)}
      >
        <DialogContent className="bg-surface border-surface-border sm:max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-copy-primary flex items-center gap-2">
              <History className="size-5 text-brand" />
              Progress Timeline
            </DialogTitle>
            <DialogDescription className="text-copy-secondary line-clamp-1">
              Historical progress updates for &quot;{timelineObjective?.title}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {timelineLoading ? (
              <div className="flex items-center justify-center py-12 text-copy-muted gap-2">
                <Loader2 className="size-5 animate-spin" />
                <span>Loading timeline...</span>
              </div>
            ) : timelineUpdates.length === 0 ? (
              <div className="text-center py-10 text-copy-muted text-xs">
                No progress updates recorded for this objective yet.
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-border">
                {timelineUpdates.map((update) => (
                  <div key={update.id} className="relative space-y-1.5">
                    <div className="absolute -left-6 top-1 size-2.5 rounded-full bg-brand ring-4 ring-surface" />
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-copy-primary">
                        {update.author.name}
                      </span>
                      <span className="text-copy-muted font-mono text-[11px]">
                        {formatDate(new Date(update.createdAt))} (
                        {formatRelative(new Date(update.createdAt))})
                      </span>
                    </div>
                    <div className="rounded-xl border border-surface-border/70 bg-subtle/50 p-3 text-xs text-copy-secondary leading-relaxed">
                      {update.note}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTimelineObjective(null)}
              className="border-surface-border text-copy-primary"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
