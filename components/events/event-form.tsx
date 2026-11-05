"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Eye,
  Loader2,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import type { EventVisibility, EventStatus } from "@prisma/client";
import { INSTITUTION_TIMEZONE } from "@/lib/config";
import { utcToDatetimeLocalInput, datetimeLocalInputToUTC } from "@/lib/format";
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

interface InitialEventData {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: Date | string;
  endsAt: Date | string;
  capacity: number | null;
  visibility: EventVisibility;
  status: EventStatus;
}

interface EventFormProps {
  clubId: string;
  initialData?: InitialEventData;
  activeRegistrationsCount?: number;
}

export function EventForm({
  clubId,
  initialData,
  activeRegistrationsCount = 0,
}: EventFormProps) {
  const router = useRouter();
  const isEditMode = !!initialData;

  // Initialize dates
  const defaultStartsAt = initialData
    ? utcToDatetimeLocalInput(initialData.startsAt)
    : (() => {
        const tomorrow = new Date(Date.now() + 86400000);
        tomorrow.setHours(14, 0, 0, 0);
        return utcToDatetimeLocalInput(tomorrow);
      })();

  const defaultEndsAt = initialData
    ? utcToDatetimeLocalInput(initialData.endsAt)
    : (() => {
        const tomorrow = new Date(Date.now() + 86400000);
        tomorrow.setHours(16, 0, 0, 0);
        return utcToDatetimeLocalInput(tomorrow);
      })();

  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [location, setLocation] = useState(initialData?.location || "");
  const [startsAt, setStartsAt] = useState(defaultStartsAt);
  const [endsAt, setEndsAt] = useState(defaultEndsAt);
  const [capacity, setCapacity] = useState<string>(
    initialData?.capacity !== null && initialData?.capacity !== undefined
      ? String(initialData.capacity)
      : ""
  );
  const [visibility, setVisibility] = useState<EventVisibility>(
    initialData?.visibility || "CAMPUS"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsedCapacity = capacity.trim() ? parseInt(capacity, 10) : null;
  const isCapacityBelowActiveRegs =
    isEditMode &&
    parsedCapacity !== null &&
    !isNaN(parsedCapacity) &&
    parsedCapacity < activeRegistrationsCount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (title.trim().length < 3) {
      toast.error("Event title must be at least 3 characters");
      return;
    }

    if (description.trim().length === 0) {
      toast.error("Event description is required");
      return;
    }

    if (location.trim().length < 2) {
      toast.error("Location must be at least 2 characters");
      return;
    }

    if (!startsAt || !endsAt) {
      toast.error("Please provide both start and end date/time");
      return;
    }

    const utcStartsAt = datetimeLocalInputToUTC(startsAt);
    const utcEndsAt = datetimeLocalInputToUTC(endsAt);

    if (new Date(utcEndsAt) <= new Date(utcStartsAt)) {
      toast.error("Event end time must be after the start time");
      return;
    }

    if (!isEditMode && new Date(utcStartsAt) <= new Date()) {
      toast.error("Event start time must be in the future");
      return;
    }

    if (isCapacityBelowActiveRegs) {
      toast.error(
        `Capacity cannot be set below active registrations (${activeRegistrationsCount})`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        startsAt: utcStartsAt,
        endsAt: utcEndsAt,
        capacity: parsedCapacity,
        visibility,
      };

      const url = isEditMode
        ? `/api/events/${initialData.id}`
        : `/api/clubs/${clubId}/events`;

      const res = await fetch(url, {
        method: isEditMode ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to save event");
      }

      toast.success(
        isEditMode
          ? "Event updated successfully"
          : "Draft event created successfully"
      );

      const eventId = isEditMode ? initialData.id : json.data.id;
      router.push(`/clubs/${clubId}/events/${eventId}`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to save event");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-7 shadow-xs space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-copy-primary text-xs font-medium">
            Event Title <span className="text-state-error">*</span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Annual Hackathon Opening Ceremony"
            maxLength={120}
            required
            className="bg-surface border-surface-border text-sm"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-copy-primary text-xs font-medium">
            Description <span className="text-state-error">*</span>
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detail the agenda, speakers, refreshments, and participant requirements..."
            maxLength={2000}
            required
            className="bg-surface border-surface-border text-sm resize-none h-32"
          />
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <Label htmlFor="location" className="text-copy-primary text-xs font-medium">
            Location <span className="text-state-error">*</span>
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-copy-muted" />
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Science Hall, Room 302 or Online Link"
              maxLength={200}
              required
              className="bg-surface border-surface-border pl-9 text-sm"
            />
          </div>
        </div>

        {/* Date & Time Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="startsAt" className="text-copy-primary text-xs font-medium flex items-center gap-1.5">
              <Calendar className="size-3.5 text-brand" />
              Start Date & Time ({INSTITUTION_TIMEZONE}) <span className="text-state-error">*</span>
            </Label>
            <Input
              id="startsAt"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              required
              className="bg-surface border-surface-border text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="endsAt" className="text-copy-primary text-xs font-medium flex items-center gap-1.5">
              <Clock className="size-3.5 text-brand" />
              End Date & Time ({INSTITUTION_TIMEZONE}) <span className="text-state-error">*</span>
            </Label>
            <Input
              id="endsAt"
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              required
              className="bg-surface border-surface-border text-sm"
            />
          </div>
        </div>

        {/* Capacity & Visibility Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="capacity" className="text-copy-primary text-xs font-medium flex items-center gap-1.5">
              <Users className="size-3.5 text-copy-muted" />
              Attendee Capacity (Optional)
            </Label>
            <Input
              id="capacity"
              type="number"
              min={1}
              max={10000}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="Leave empty for unlimited"
              className="bg-surface border-surface-border text-sm"
            />
            {isCapacityBelowActiveRegs && (
              <p className="text-xs text-state-error flex items-center gap-1 mt-1">
                <AlertTriangle className="size-3 shrink-0" />
                Cannot be lower than {activeRegistrationsCount} current registrants
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-copy-primary text-xs font-medium flex items-center gap-1.5">
              <Eye className="size-3.5 text-copy-muted" />
              Audience Visibility
            </Label>
            <Select
              value={visibility}
              onValueChange={(val) => setVisibility(val as EventVisibility)}
            >
              <SelectTrigger className="bg-surface border-surface-border text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-surface border-surface-border">
                <SelectItem value="CAMPUS">Campus (Open to all students)</SelectItem>
                <SelectItem value="MEMBERS_ONLY">Members Only (Club members only)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-4">
        <Button
          asChild
          type="button"
          variant="outline"
          className="border-surface-border text-copy-primary hover:bg-subtle gap-1.5"
        >
          <Link
            href={
              isEditMode
                ? `/clubs/${clubId}/events/${initialData.id}`
                : `/clubs/${clubId}?tab=events`
            }
          >
            <ArrowLeft className="size-3.5" />
            Cancel
          </Link>
        </Button>

        <Button
          type="submit"
          disabled={isSubmitting || isCapacityBelowActiveRegs}
          className="bg-brand text-brand-foreground hover:bg-brand/90 font-medium shadow-xs"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="size-3.5 animate-spin" />
              {isEditMode ? "Saving Changes..." : "Saving Draft..."}
            </span>
          ) : isEditMode ? (
            "Save Changes"
          ) : (
            "Save as Draft"
          )}
        </Button>
      </div>
    </form>
  );
}
