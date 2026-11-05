"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Save, Loader2, AlertCircle, Clock, Info } from "lucide-react";

import type { ClubDetailsData } from "@/lib/data/clubs";
import {
  clubProfileUpdateSchema,
  type ClubProfileUpdateInput,
} from "@/lib/validation/club";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export interface ClubSettingsFormProps {
  club: ClubDetailsData;
  isAdmin: boolean;
}

export function ClubSettingsForm({ club, isAdmin }: ClubSettingsFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [globalError, setGlobalError] = React.useState<string | null>(null);

  // Editing is disabled for non-admins when the club is not ACTIVE
  const isEditingDisabled = !isAdmin && club.status !== "ACTIVE";
  const isRejected = club.status === "REJECTED";

  const form = useForm<ClubProfileUpdateInput>({
    resolver: zodResolver(clubProfileUpdateSchema),
    defaultValues: {
      name: club.name,
      description: club.description,
    },
    mode: "onTouched",
  });

  const onSubmit = async (values: ClubProfileUpdateInput) => {
    if (isEditingDisabled || isRejected) return;

    setIsSubmitting(true);
    setGlobalError(null);

    try {
      const res = await fetch(`/api/clubs/${club.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.error?.fields) {
          for (const [key, msg] of Object.entries(json.error.fields)) {
            form.setError(key as any, {
              type: "server",
              message: msg as string,
            });
          }
        }
        const errorMsg = json.error?.message || "Failed to update club profile";
        setGlobalError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      toast.success("Club profile updated successfully!");
      router.refresh();
    } catch (err) {
      console.error("[ClubSettingsForm] Update error:", err);
      const msg = "Network error occurred. Please try again.";
      setGlobalError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notice banner if editing is disabled */}
      {isEditingDisabled && (
        <div className="rounded-xl border border-state-warning/30 bg-state-warning-dim p-4 flex items-start gap-3 text-xs text-state-warning">
          <Info className="size-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block">Editing Locked</span>
            <p className="leading-relaxed">
              Club profile editing is locked while the club is {club.status}. As president, you will be able to edit the organization's charter details once the club is fully approved and ACTIVE.
            </p>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="rounded-xl border border-state-error/30 bg-state-error-dim p-4 flex items-start gap-3 text-xs text-state-error">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Terminal Rejection</span>
            <p className="leading-relaxed">
              This organization proposal has been rejected. Terminal proposals cannot be edited.
            </p>
          </div>
        </div>
      )}

      {/* Meta header showing last update timestamp */}
      <div className="flex items-center justify-between text-xs text-copy-muted pb-4 border-b border-surface-border">
        <span className="flex items-center gap-1.5 font-mono">
          <Clock className="size-3.5 text-copy-muted" />
          Last updated: {formatDateTime(club.updatedAt)}
        </span>
        <span className="text-copy-secondary font-medium">
          Status: <strong className="text-copy-primary">{club.status}</strong>
        </span>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {globalError && (
            <div className="flex items-center gap-2 rounded-xl bg-state-error-dim p-4 text-xs font-medium text-state-error border border-state-error/30">
              <AlertCircle className="size-4 shrink-0" />
              <span>{globalError}</span>
            </div>
          )}

          {/* Club Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-copy-primary font-medium text-xs">
                  Official Club Name <span className="text-state-error">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={isSubmitting || isEditingDisabled || isRejected}
                    className="rounded-xl border-surface-border bg-surface text-copy-primary focus-visible:ring-brand text-xs sm:text-sm"
                  />
                </FormControl>
                <FormDescription className="text-xs text-copy-muted">
                  Official campus name (3 to 80 characters). Must be unique campus-wide.
                </FormDescription>
                <FormMessage className="text-state-error text-xs" />
              </FormItem>
            )}
          />

          {/* Club Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-copy-primary font-medium text-xs">
                  Description & Mission Statement <span className="text-state-error">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    rows={6}
                    {...field}
                    disabled={isSubmitting || isEditingDisabled || isRejected}
                    className="rounded-xl border-surface-border bg-surface text-copy-primary focus-visible:ring-brand text-xs sm:text-sm min-h-36"
                  />
                </FormControl>
                <FormDescription className="text-xs text-copy-muted">
                  Between 20 and 2000 characters summarizing the organization's charter and objectives.
                </FormDescription>
                <FormMessage className="text-state-error text-xs" />
              </FormItem>
            )}
          />

          <div className="pt-4 border-t border-surface-border flex items-center justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || isEditingDisabled || isRejected}
              className="rounded-xl bg-brand text-brand-foreground hover:bg-brand/90 font-medium text-xs h-9 px-5 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="size-3.5 mr-1.5" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
