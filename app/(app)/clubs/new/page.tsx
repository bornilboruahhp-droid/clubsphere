import { Metadata } from "next";
import { requireUser } from "@/lib/auth/get-current-user";
import { requireProfileComplete } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { ClubRegistrationForm } from "@/components/clubs/club-registration-form";

export const metadata: Metadata = {
  title: "Register a Club | ClubSphere",
  description: "Submit a new student club charter proposal for faculty and admin review",
};

export default async function NewClubPage() {
  const user = await requireUser();
  requireProfileComplete(user);

  const advisors = await prisma.user.findMany({
    where: {
      role: "ADVISOR",
    },
    select: {
      id: true,
      name: true,
      department: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <PageHeader
        title="Register a Club"
        description="Submit your organization's charter proposal for faculty sponsor review and administrative recognition."
      />

      <div className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-8 shadow-sm">
        <ClubRegistrationForm advisors={advisors} />
      </div>
    </div>
  );
}
