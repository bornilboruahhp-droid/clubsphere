import * as React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser, isProfileComplete } from "@/lib/auth/get-current-user";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  if (user) {
    const profileDone = isProfileComplete(user);

    // If profile is incomplete, redirect to /onboarding for every route except /onboarding and /profile
    if (!profileDone && pathname !== "/onboarding" && pathname !== "/profile") {
      redirect("/onboarding");
    }

    // If profile is already complete, redirect away from /onboarding
    if (profileDone && pathname === "/onboarding") {
      redirect("/dashboard");
    }
  }

  const role = user?.role ?? "STUDENT";

  return <AppShell initialRole={role}>{children}</AppShell>;
}
