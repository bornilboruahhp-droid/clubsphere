import * as React from "react";
import { GraduationCap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-base text-copy-primary">
      {/* Left Panel: Desktop Brand & Feature Summary */}
      <div className="hidden lg:flex flex-col justify-between p-12 lg:p-16 border-r border-surface-border bg-subtle">
        {/* Top: Logo */}
        <div className="flex items-center gap-2.5 font-semibold text-lg text-copy-primary tracking-tight">
          <div className="flex size-8 items-center justify-center rounded-xl bg-brand text-brand-foreground">
            <GraduationCap className="size-5" />
          </div>
          <span>ClubSphere</span>
        </div>

        {/* Center: Tagline & Text-Only Feature List */}
        <div className="flex flex-col gap-8 max-w-md">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-copy-primary">
              Campus Club & Organization Platform
            </h1>
            <p className="text-sm text-copy-secondary leading-relaxed">
              A calm, unified workspace for student-led organizations, campus activities, and governance.
            </p>
          </div>

          <div className="flex flex-col gap-6 border-t border-surface-border pt-6">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-copy-primary">
                Clubs & Societies
              </span>
              <span className="text-xs text-copy-secondary leading-normal">
                Discover student communities, submit new club registrations, and manage verified memberships.
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-copy-primary">
                Events & Attendance
              </span>
              <span className="text-xs text-copy-secondary leading-normal">
                Browse campus schedules, register for workshops, and track attendance via check-in.
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-copy-primary">
                Elections & Governance
              </span>
              <span className="text-xs text-copy-secondary leading-normal">
                Nominate eligible candidates and cast secure, verifiable secret ballots for club leadership.
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Context */}
        <div className="text-xs text-copy-muted">
          Official Institution Portal • All Rights Reserved
        </div>
      </div>

      {/* Right Panel: Form Viewport */}
      <div className="flex min-h-screen items-center justify-center p-4 sm:p-6 md:p-10">
        <div className="w-full max-w-md flex flex-col items-center justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}
