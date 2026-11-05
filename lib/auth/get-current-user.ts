import { auth, currentUser } from "@clerk/nextjs/server";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { unauthenticated } from "@/lib/api/errors";

/**
 * Checks if the user's profile is complete (both studentId and department are set).
 */
export function isProfileComplete(user: Pick<User, "studentId" | "department">): boolean {
  return Boolean(user.studentId && user.department);
}

/**
 * Resolves the authenticated user from Clerk session and syncs with PostgreSQL.
 * Creates local User row on first login; updates email/name on repeat logins.
 * Never overwrites role, studentId, or department on update.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<User | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  // Fetch Clerk profile for email and name
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const primaryEmail =
    clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ||
    clerkUser.emailAddresses[0]?.emailAddress ||
    "";

  const fullName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    clerkUser.username ||
    (primaryEmail ? primaryEmail.split("@")[0] : "") ||
    "User";

  // Upsert local database record
  const dbUser = await prisma.user.upsert({
    where: { id: userId },
    create: {
      id: userId,
      email: primaryEmail,
      name: fullName,
      role: "STUDENT",
    },
    update: {
      email: primaryEmail,
      name: fullName,
      // Note: role, studentId, and department are intentionally preserved
    },
  });

  return dbUser;
}

/**
 * Ensures a user is signed in, throwing an UNAUTHENTICATED ApiError (401) if not.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    throw unauthenticated("User authentication required");
  }

  return user;
}
