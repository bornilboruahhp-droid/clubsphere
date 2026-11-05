import * as React from "react";
import { User, Mail, Shield } from "lucide-react";

import { requireUser } from "@/lib/auth/get-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileForm } from "@/components/profile/profile-form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <PageHeader
        title="Profile Settings"
        description="View your institutional account details and update your student information."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Read-Only Identity Card */}
        <Card className="border-surface-border bg-surface rounded-2xl md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-copy-primary">
              Account Identity
            </CardTitle>
            <CardDescription className="text-xs text-copy-secondary">
              Identity details synced directly from Clerk.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-copy-muted flex items-center gap-1.5">
                <User className="size-3.5" /> Full Name
              </span>
              <span className="text-sm font-medium text-copy-primary">
                {user.name}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-copy-muted flex items-center gap-1.5">
                <Mail className="size-3.5" /> Email
              </span>
              <span className="text-sm font-medium text-copy-primary truncate">
                {user.email}
              </span>
            </div>

            <div className="flex flex-col gap-1 pt-2 border-t border-surface-border">
              <span className="text-xs text-copy-muted flex items-center gap-1.5">
                <Shield className="size-3.5" /> Platform Role
              </span>
              <div>
                <Badge variant="secondary" className="font-mono text-xs">
                  {user.role}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Credentials Form Card */}
        <Card className="border-surface-border bg-surface rounded-2xl md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-copy-primary">
              Student Credentials
            </CardTitle>
            <CardDescription className="text-xs text-copy-secondary">
              Required for club memberships, role assignments, and voting eligibility.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              defaultValues={{
                studentId: user.studentId || "",
                department: user.department || "",
              }}
              submitLabel="Save Changes"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
