"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { profileSchema, type ProfileInput } from "@/lib/validation/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";

export interface ProfileFormProps {
  defaultValues?: Partial<ProfileInput>;
  onSuccess?: (updatedUser: unknown) => void;
  submitLabel?: string;
}

export function ProfileForm({
  defaultValues,
  onSuccess,
  submitLabel = "Save Profile",
}: ProfileFormProps) {
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      studentId: defaultValues?.studentId || "",
      department: defaultValues?.department || "",
    },
  });

  async function onSubmit(values: ProfileInput) {
    startTransition(async () => {
      try {
        const res = await fetch("/api/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        const json = await res.json();

        if (!res.ok) {
          if (json.error?.fields) {
            for (const [key, msg] of Object.entries(json.error.fields)) {
              form.setError(key as keyof ProfileInput, {
                type: "manual",
                message: msg as string,
              });
            }
          } else {
            toast.error(json.error?.message || "Failed to save profile");
          }
          return;
        }

        toast.success("Profile saved successfully");
        if (onSuccess) {
          onSuccess(json.data);
        }
      } catch (err) {
        toast.error("Network error. Please try again.");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <FormField
          control={form.control}
          name="studentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student ID</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. CS2026101"
                  className="border-surface-border rounded-xl"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs text-copy-muted">
                Your unique university-issued student identification code.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Computer Science & Engineering"
                  className="border-surface-border rounded-xl"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs text-copy-muted">
                Your affiliated academic school or department.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={isPending}
            className="rounded-xl w-full sm:w-auto"
          >
            {isPending && <Loader2 className="size-4 animate-spin" data-icon="inline-start" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
