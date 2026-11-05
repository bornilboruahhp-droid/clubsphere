"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Sparkles, AlertCircle } from "lucide-react";

import {
  clubRegistrationSchema,
  type ClubRegistrationInput,
} from "@/lib/validation/club";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export interface AdvisorOption {
  id: string;
  name: string;
  department: string | null;
}

export interface ClubRegistrationFormProps {
  advisors: AdvisorOption[];
}

export function ClubRegistrationForm({ advisors }: ClubRegistrationFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [globalError, setGlobalError] = React.useState<string | null>(null);

  const form = useForm<ClubRegistrationInput>({
    resolver: zodResolver(clubRegistrationSchema),
    defaultValues: {
      name: "",
      description: "",
      advisorId: "",
      objectives: [""],
    },
    mode: "onTouched",
  });

  const objectives = form.watch("objectives") || [""];

  const handleAddObjective = () => {
    if (objectives.length < 5) {
      form.setValue("objectives", [...objectives, ""], { shouldDirty: true, shouldTouch: true });
    }
  };

  const handleRemoveObjective = (index: number) => {
    if (objectives.length > 1) {
      const updated = objectives.filter((_, i) => i !== index);
      form.setValue("objectives", updated, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    }
  };

  const onSubmit = async (values: ClubRegistrationInput) => {
    setIsSubmitting(true);
    setGlobalError(null);

    try {
      const res = await fetch("/api/clubs", {
        method: "POST",
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
        const errorMsg = json.error?.message || "Failed to submit club registration";
        setGlobalError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      toast.success("Club registration submitted successfully!");
      router.push(`/clubs/${json.data.id}`);
    } catch (err) {
      console.error("[ClubRegistrationForm] Submission error:", err);
      const msg = "A network error occurred. Please try again.";
      setGlobalError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
              <FormLabel className="text-copy-primary font-medium">
                Club Name <span className="text-state-error">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Robotics & Automation Society"
                  {...field}
                  className="rounded-xl border-surface-border bg-surface text-copy-primary focus-visible:ring-brand"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription className="text-xs text-copy-muted">
                Official title of the student club (3 to 80 characters). Must be unique campus-wide.
              </FormDescription>
              <FormMessage className="text-state-error text-xs" />
            </FormItem>
          )}
        />

        {/* Faculty Advisor Selector */}
        <FormField
          control={form.control}
          name="advisorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-copy-primary font-medium">
                Faculty Advisor <span className="text-state-error">*</span>
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger className="w-full rounded-xl border-surface-border bg-surface text-copy-primary focus-visible:ring-brand h-10">
                    <SelectValue placeholder="Select a faculty advisor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="border-surface-border bg-elevated">
                  {advisors.map((advisor) => (
                    <SelectItem
                      key={advisor.id}
                      value={advisor.id}
                      className="cursor-pointer text-copy-primary hover:bg-subtle"
                    >
                      {advisor.name}
                      {advisor.department ? ` (${advisor.department})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription className="text-xs text-copy-muted">
                Every official student club must have a registered faculty advisor who will sponsor and review the proposal.
              </FormDescription>
              <FormMessage className="text-state-error text-xs" />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-copy-primary font-medium">
                Description & Mission <span className="text-state-error">*</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide a comprehensive overview of the organization's mission, planned scope of activities, and value to campus..."
                  rows={5}
                  {...field}
                  className="rounded-xl border-surface-border bg-surface text-copy-primary focus-visible:ring-brand min-h-32"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription className="text-xs text-copy-muted">
                Between 20 and 2000 characters describing your club's charter and goals.
              </FormDescription>
              <FormMessage className="text-state-error text-xs" />
            </FormItem>
          )}
        />

        {/* Planned Objectives Repeater */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-copy-primary flex items-center gap-1.5">
                <Sparkles className="size-4 text-brand" />
                Charter Objectives <span className="text-state-error">*</span>
              </h3>
              <p className="text-xs text-copy-muted">
                List 1 to 5 key milestones or objectives the club intends to accomplish during its first cycle.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddObjective}
              disabled={objectives.length >= 5 || isSubmitting}
              className="text-xs rounded-xl border-surface-border text-copy-secondary hover:text-copy-primary hover:bg-subtle"
            >
              <Plus className="size-3.5 mr-1" />
              Add Objective
            </Button>
          </div>

          <div className="space-y-3">
            {objectives.map((_, index) => (
              <FormField
                key={index}
                control={form.control}
                name={`objectives.${index}`}
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-subtle text-xs font-mono font-medium text-copy-muted">
                        {index + 1}
                      </span>
                      <FormControl>
                        <Input
                          placeholder={`Objective ${index + 1} (e.g. Conduct monthly technical workshop)`}
                          {...field}
                          disabled={isSubmitting}
                          className="rounded-xl border-surface-border bg-surface text-copy-primary focus-visible:ring-brand"
                        />
                      </FormControl>
                      {objectives.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveObjective(index)}
                          disabled={isSubmitting}
                          aria-label={`Remove objective ${index + 1}`}
                          className="shrink-0 text-copy-muted hover:text-state-error hover:bg-state-error-dim"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                    <FormMessage className="text-state-error text-xs pl-9" />
                  </FormItem>
                )}
              />
            ))}
          </div>
          {form.formState.errors.objectives && !Array.isArray(form.formState.errors.objectives) && (
            <p className="text-xs text-state-error">
              {form.formState.errors.objectives.message}
            </p>
          )}
        </div>

        {/* Submit Action */}
        <div className="pt-4 border-t border-surface-border flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="rounded-xl text-copy-secondary hover:text-copy-primary hover:bg-subtle"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-brand text-brand-foreground hover:bg-brand/90 px-6 font-medium shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Submitting Registration...
              </>
            ) : (
              "Submit Registration"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
