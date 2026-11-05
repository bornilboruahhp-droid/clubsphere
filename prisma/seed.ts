import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { prisma } from "../lib/prisma";

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;

  if (!adminEmail) {
    console.warn("⚠️  SEED_ADMIN_EMAIL is not set. Skipping admin promotion.");
    return;
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingUser) {
    console.log(
      `ℹ️  User with email "${adminEmail}" does not exist yet. Please sign in once first, then re-run the seed script.`
    );
    return;
  }

  if (existingUser.role === "ADMIN") {
    console.log(`✅ User "${adminEmail}" is already an ADMIN (idempotent).`);
    return;
  }

  const updatedUser = await prisma.user.update({
    where: { email: adminEmail },
    data: { role: "ADMIN" },
  });

  console.log(`🎉 Promoted user "${updatedUser.email}" (${updatedUser.id}) to ADMIN.`);
}

main()
  .catch((e) => {
    console.error("❌ Seed script failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
