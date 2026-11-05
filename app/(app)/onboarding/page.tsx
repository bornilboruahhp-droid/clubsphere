"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";

import { ProfileForm } from "@/components/profile/profile-form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-6 sm:py-10">
      <Card className="w-full max-w-xl border-surface-border bg-surface rounded-2xl shadow-sm">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-brand text-brand-foreground mb-2">
            <GraduationCap className="size-6" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-semibold tracking-tight text-copy-primary">
            Complete Your Profile
          </CardTitle>
          <CardDescription className="text-sm text-copy-secondary max-w-md mx-auto">
            Please provide your student ID and academic department to register clubs, join organizations, and participate in campus elections.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <ProfileForm
            submitLabel="Complete Onboarding"
            onSuccess={() => {
              router.push("/dashboard");
              router.refresh();
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
