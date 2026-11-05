"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Megaphone,
  Plus,
  Users,
  Calendar,
  Trash2,
  Loader2,
  Clock,
  User,
} from "lucide-react";
import type { AnnouncementAudience } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
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
import { EmptyState } from "@/components/layout/empty-state";
import { formatDateTime, formatRelative } from "@/lib/format";
import type { ClubAnnouncementItem } from "@/lib/data/announcements";

interface ClubAnnouncementsTabProps {
  clubId: string;
  initialAnnouncements: ClubAnnouncementItem[];
  isManager: boolean;
  clubEvents: Array<{ id: string; title: string }>;
}

export function ClubAnnouncementsTab({
  clubId,
  initialAnnouncements,
  isManager,
  clubEvents,
}: ClubAnnouncementsTabProps) {
  const router = useRouter();
  const [announcements, setAnnouncements] =
    useState<ClubAnnouncementItem[]>(initialAnnouncements);

  // Dialog State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<AnnouncementAudience>("ALL_MEMBERS");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const resetForm = () => {
    setTitle("");
    setBody("");
    setAudience("ALL_MEMBERS");
    setSelectedEventId("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (title.trim().length < 3 || title.trim().length > 120) {
      toast.error("Title must be between 3 and 120 characters.");
      return;
    }

    if (body.trim().length < 3 || body.trim().length > 2000) {
      toast.error("Body must be between 3 and 2000 characters.");
      return;
    }

    if (audience === "EVENT_REGISTRANTS" && !selectedEventId) {
      toast.error("Please select a target event for this announcement.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          audience,
          eventId: audience === "EVENT_REGISTRANTS" ? selectedEventId : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to post announcement");
      }

      setAnnouncements((prev) => [json.data, ...prev]);
      setIsCreateOpen(false);
      resetForm();
      toast.success("Announcement broadcasted successfully!");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to post announcement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/clubs/${clubId}/announcements/${deletingId}`,
        { method: "DELETE" }
      );
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to delete announcement");
      }

      setAnnouncements((prev) => prev.filter((a) => a.id !== deletingId));
      setDeletingId(null);
      toast.success("Announcement deleted.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete announcement.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-surface-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-copy-primary">
              Club Announcements
            </h3>
            <Badge
              variant="secondary"
              className="text-xs px-2 py-0 bg-subtle text-copy-muted"
            >
              {announcements.length}
            </Badge>
          </div>
          <p className="text-xs text-copy-muted">
            Important updates, meeting agendas, and notifications for members.
          </p>
        </div>

        {isManager && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-brand text-white hover:bg-brand/90 gap-1.5 self-start sm:self-auto">
                <Plus className="size-4" />
                New Announcement
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-lg">
              <form onSubmit={handleCreate} className="space-y-5">
                <DialogHeader className="space-y-1">
                  <DialogTitle className="text-lg font-bold text-copy-primary">
                    Post Club Announcement
                  </DialogTitle>
                  <DialogDescription className="text-xs text-copy-muted">
                    Broadcast an announcement to your club members or event attendees.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 text-xs">
                  {/* Audience Select */}
                  <div className="space-y-1.5">
                    <Label htmlFor="audience" className="text-xs font-semibold text-copy-primary">
                      Target Audience
                    </Label>
                    <Select
                      value={audience}
                      onValueChange={(val) => setAudience(val as AnnouncementAudience)}
                    >
                      <SelectTrigger id="audience" className="bg-background border-surface-border text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL_MEMBERS">
                          All Active Members
                        </SelectItem>
                        <SelectItem value="EVENT_REGISTRANTS">
                          Event Attendees (Registrants)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Event Select (Shown conditionally) */}
                  {audience === "EVENT_REGISTRANTS" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="event" className="text-xs font-semibold text-copy-primary">
                        Select Target Event
                      </Label>
                      {clubEvents.length === 0 ? (
                        <p className="text-xs text-state-warning bg-state-warning-dim p-2.5 rounded-lg border border-state-warning/30">
                          This club has no events yet. Create an event before targeting attendees.
                        </p>
                      ) : (
                        <Select
                          value={selectedEventId}
                          onValueChange={setSelectedEventId}
                        >
                          <SelectTrigger id="event" className="bg-background border-surface-border text-xs">
                            <SelectValue placeholder="Choose an event..." />
                          </SelectTrigger>
                          <SelectContent>
                            {clubEvents.map((evt) => (
                              <SelectItem key={evt.id} value={evt.id}>
                                {evt.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}

                  {/* Title */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="title" className="text-xs font-semibold text-copy-primary">
                        Title
                      </Label>
                      <span className="text-[11px] text-copy-muted font-mono">
                        {title.length}/120
                      </span>
                    </div>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. General Body Meeting Rescheduled"
                      maxLength={120}
                      className="bg-background border-surface-border text-xs"
                      required
                    />
                  </div>

                  {/* Body */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="body" className="text-xs font-semibold text-copy-primary">
                        Announcement Message
                      </Label>
                      <span className="text-[11px] text-copy-muted font-mono">
                        {body.length}/2000
                      </span>
                    </div>
                    <Textarea
                      id="body"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Write your announcement details, room changes, or reminders..."
                      rows={5}
                      maxLength={2000}
                      className="bg-background border-surface-border text-xs leading-relaxed"
                      required
                    />
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateOpen(false);
                      resetForm();
                    }}
                    className="border-surface-border text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !title.trim() ||
                      !body.trim() ||
                      (audience === "EVENT_REGISTRANTS" && !selectedEventId)
                    }
                    className="bg-brand text-white hover:bg-brand/90 text-xs"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin mr-1.5" />
                        Broadcasting...
                      </>
                    ) : (
                      "Post & Notify"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements yet"
          description="Meeting minutes, urgent updates, and broadcast messages from club managers will appear here."
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-surface-border bg-surface p-5 sm:p-6 shadow-xs space-y-4"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-3 border-b border-surface-border/60">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
                    <User className="size-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-copy-primary block">
                      {item.author.name}
                    </span>
                    <span className="text-[11px] text-copy-muted flex items-center gap-1">
                      <Clock className="size-3 text-copy-muted" />
                      {formatRelative(item.createdAt)} ({formatDateTime(item.createdAt)})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Audience Chip */}
                  {item.audience === "ALL_MEMBERS" ? (
                    <Badge
                      variant="outline"
                      className="bg-state-info-dim text-state-info border-state-info/20 text-[11px] gap-1 font-medium"
                    >
                      <Users className="size-3" />
                      All Members
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-state-warning-dim text-state-warning border-state-warning/20 text-[11px] gap-1 font-medium max-w-[200px] truncate"
                    >
                      <Calendar className="size-3 shrink-0" />
                      <span className="truncate">
                        Event: {item.event?.title || "Registrants"}
                      </span>
                    </Badge>
                  )}

                  {/* Delete Button (Manager only) */}
                  {isManager && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingId(item.id)}
                      className="text-copy-muted hover:text-state-error hover:bg-state-error-dim h-7 w-7 p-0"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Title & Body */}
              <div className="space-y-2">
                <h4 className="text-base font-bold text-copy-primary">
                  {item.title}
                </h4>
                <p className="text-xs text-copy-secondary whitespace-pre-wrap leading-relaxed">
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={Boolean(deletingId)}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the announcement from the club feed.
              Past notifications already delivered to members will not be revoked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-state-error text-white hover:bg-state-error/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Deleting...
                </>
              ) : (
                "Delete Announcement"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
